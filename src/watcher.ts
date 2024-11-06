import type { Destination, PackageNames, Source, WatcherOptions } from './types'
import process from 'node:process'
import chokidar from 'chokidar'
import { deleteAsync } from 'del'
import fs from 'fs-extra'
import { intersection, uniq } from 'lodash-es'
import { installDependencies } from 'nypm'
import { join, relative } from 'pathe'
import { CLI_NAME, DEFAULT_IGNORED, WATCH_EVENTS } from './constants'
import { checkDepsChanges } from './utils/check-deps-changes'
import { getDependantPackages } from './utils/get-dependant-packages'
import { logger } from './utils/logger'
import { setDefaultSpawnStdio } from './utils/promisified-spawn'
import { traversePkgDeps } from './utils/traverse-pkg-deps'
import { publishPackagesAndInstall } from './verdaccio'

let numOfCopiedFiles = 0
const MAX_COPY_RETRIES = 3

function quit() {
  logger.info(`Copied ${numOfCopiedFiles} files. Exiting...`)
  process.exit()
}

interface CopyPathArgs {
  oldPath: string
  newPath: string
  packageName: string
}

interface PrivateCopyPathArgs extends CopyPathArgs {
  resolve: (value: void | PromiseLike<void>) => void
  reject: (err: Error) => void
  retry?: number
}

export async function watcher(source: Source, destination: Destination, packages: PackageNames | undefined, options: WatcherOptions) {
  const { packageNamesToFilePath, packages: sourcePackages } = source
  const { packages: destinationPackages, hasWorkspaces: destinationHasWorkspaces } = destination
  const { verbose: isVerbose, scanOnce } = options
  let { forceVerdaccio } = options

  setDefaultSpawnStdio(isVerbose ? 'inherit' : 'ignore')

  // Current logic of copying files from source to destination doesn't work with workspaces (inside destination), so force verdaccio usage for now.
  // TODO: Implement file copying logic for workspaces in destination
  if (destinationHasWorkspaces && !forceVerdaccio) {
    forceVerdaccio = true
    logger.info('Workspaces detected in destination. Automatically enabling \`--force-verdaccio\` flag.')
  }

  let afterPackageInstallation = false
  let queuedCopies: Array<PrivateCopyPathArgs> = []

  function _copyPath(args: PrivateCopyPathArgs) {
    const { oldPath, newPath, resolve, reject, retry = 0 } = args

    fs.copy(oldPath, newPath, (err) => {
      if (err) {
        if (retry >= MAX_COPY_RETRIES) {
          logger.error(err)
          reject(err)
          return
        }
        else {
          setTimeout(
            () => _copyPath({ ...args, retry: retry + 1 }),
            500 * 2 ** retry,
          )
          return
        }
      }

      // TODO(feature): Handle case where copied file needs to be executable. Use fs.chmodSync(newPath, '0755') for that.

      numOfCopiedFiles += 1
      logger.log(`Copied \`${relative(source.path, oldPath)}\` to \`${newPath}\``)

      resolve()
    })
  }

  function copyPath({ oldPath, newPath, packageName }: CopyPathArgs) {
    return new Promise<void>((resolve, reject) => {
      const args = { oldPath, newPath, packageName, resolve, reject }

      if (afterPackageInstallation)
        _copyPath(args)
      else
        queuedCopies.push(args)
    })
  }

  function runQueuedCopies() {
    afterPackageInstallation = true

    queuedCopies.forEach(_copyPath)
    queuedCopies = []
  }

  /**
   * Cleanup stale JS artifacts/dist files from node_modules. They'll be copied over anyways. But don't delete nested node_modules files
   */
  async function clearStaleJsFileFromNodeModules() {
    const packagesToClear = queuedCopies.reduce<Set<string>>((acc, { packageName }) => {
      if (packageName)
        acc.add(packageName)

      return acc
    }, new Set())

    await Promise.all(
      [...packagesToClear].map(
        async packageToClear => await deleteAsync([
          `node_modules/${packageToClear}/**/*.{js,js.map}`,
          `!node_modules/${packageToClear}/node_modules/**/*.{js,js.map}`,
          `!node_modules/${packageToClear}/src/**/*.{js,js.map}`,
        ]),
      ),
    )
  }

  // Check the dependencies of the destination packages. They might depend on other packages inside the source location. If they do, we need to copy them over as well.
  const { seenPackages, depTree } = traversePkgDeps({
    packages: uniq(destinationPackages),
    sourcePackages,
    packageNamesToFilePath,
  })

  // If secco is run without the "packages" command, we need to copy all packages from the source location to the destination location
  const allPackagesToWatch = packages ? intersection(packages, seenPackages) : seenPackages

  const ignoredPackageJson: Map<string, Array<string>> = new Map()
  function ignorePackageJsonChanges(packageName: string, contentArray: Array<string>) {
    ignoredPackageJson.set(packageName, contentArray)

    return () => {
      ignoredPackageJson.delete(packageName)
    }
  }

  if (forceVerdaccio) {
    try {
      logger.debug(`Running ${CLI_NAME} with --force-verdaccio flag. Packages to watch: ${allPackagesToWatch.join(', ')}`)

      if (allPackagesToWatch.length > 0) {
        await publishPackagesAndInstall({
          packagesToPublish: allPackagesToWatch,
          packageNamesToFilePath,
          ignorePackageJsonChanges,
          source,
          destination,
        })
      }
      else {
        // Use package manager inside destination repository to install dependencies
        logger.log('Installing dependencies from public npm registry...')
        await installDependencies({ cwd: process.cwd(), silent: !isVerbose })
        logger.success('Installation complete')
      }
    }
    catch (e) {
      logger.error(e)
    }

    if (scanOnce)
      quit()
  }

  if (allPackagesToWatch.length === 0) {
    logger.error('No packages to watch. Add the package names of your source to the \`package.json\` of your destination and try again.')
    return
  }

  const ignored = DEFAULT_IGNORED.concat(
    allPackagesToWatch.map(
      p => new RegExp(`${p}[\\/\\\\]src[\\/\\\\]`, 'i'),
    ),
  )
  const watchers = uniq(
    allPackagesToWatch
      .map(p => join(packageNamesToFilePath.get(p) as string))
      .filter(p => fs.existsSync(p)),
  )

  let allCopies: Array<Promise<void>> = []
  const packagesToPublish: Set<string> = new Set()
  let isInitialScan = true
  let isPublishing = false
  const waitFor = new Set()
  let anyPackageNotInstalled = false

  const pkgPathMatchingEntries = Array.from(packageNamesToFilePath.entries())

  chokidar
    .watch(watchers, {
      ignored: [filePath => ignored.some(i => i.test(filePath))],
    })
    .on('all', async (event, file) => {
      if (!WATCH_EVENTS.includes(event))
        return

      // Match name against package path
      let packageName

      for (const [_packageName, packagePath] of pkgPathMatchingEntries) {
        const relativePath = relative(packagePath, file)
        if (!relativePath.startsWith('..')) {
          packageName = _packageName
          break
        }
      }

      if (!packageName)
        return

      const prefix = packageNamesToFilePath.get(packageName)

      if (!prefix)
        return

      const relativePackageFile = relative(prefix, file)
      const nodeModulesFilePath = join(`./node_modules/${packageName}`, relativePackageFile)

      if (relativePackageFile === 'package.json') {
      // package.json files will change during publishing to adjust version of package and dependencies. Ignore those changes during publishing.
        if (isPublishing)
          return

        // Compare source dependencies with the ones in the destination package.json
        const didDependenciesChangePromise = checkDepsChanges({
          nodeModulesFilePath,
          packageName,
          sourcePackages,
          packageNamesToFilePath,
          isInitialScan,
          ignoredPackageJson,
        })

        if (isInitialScan) {
        // checkDepsChanges can do async GET requests to unpkg.com. We need to make sure that we wait for those requests before attempting to install the dependencies.
          waitFor.add(didDependenciesChangePromise)
        }

        const { didDepsChange, pkgNotInstalled } = await didDependenciesChangePromise

        if (pkgNotInstalled)
          anyPackageNotInstalled = true

        if (didDepsChange) {
          if (isInitialScan) {
            waitFor.delete(didDependenciesChangePromise)

            // TODO(feature): Handle case where dependency change happens (e.g. added or removed package) during 'watch' mode.
            // secco currently doesn't handle this case. It will only pick those changes up during its initial scan.

            // At this stage secco knows which dependency changed. But now it needs to figure out which packages it needs to publish. If e.g. package-b changed (but package-a depends on it), then both package-a and package-b need to be published and installed.

            getDependantPackages({
              packageName,
              depTree,
            }).forEach((pkg) => {
              packagesToPublish.add(pkg)
            })
          }
        }

      // Do not copy package.json files as this will mess up future dependency checks. So if code reaches this path, do nothing.
      }

      const localCopies = [copyPath({ oldPath: file, newPath: nodeModulesFilePath, packageName })]

      allCopies = allCopies.concat(localCopies)
    })
    .on('ready', async () => {
    // Wait for all async work to finish before attempting to publish & install
      await Promise.all(Array.from(waitFor))

      if (isInitialScan) {
        isInitialScan = false

        logger.debug(`Initial scan complete.`)

        if (packagesToPublish.size > 0) {
          isPublishing = true

          logger.debug(`Trying to publish: ${Array.from(packagesToPublish).join(', ')}`)

          await publishPackagesAndInstall({
            packagesToPublish: Array.from(packagesToPublish),
            packageNamesToFilePath,
            ignorePackageJsonChanges,
            source,
            destination,
          })

          packagesToPublish.clear()
          isPublishing = false
        }
        else if (anyPackageNotInstalled) {
          // Use package manager inside destination repository to install dependencies
          logger.log('Installing dependencies from public npm registry...')
          await installDependencies({ cwd: process.cwd(), silent: !isVerbose })
          logger.success('Installation complete')
        }

        await clearStaleJsFileFromNodeModules()
        runQueuedCopies()
      }

      // All files watched, quit once all files are copied and scanOnce is true
      Promise.all(allCopies).then(() => {
        if (scanOnce)
          quit()
      })
    })
}
