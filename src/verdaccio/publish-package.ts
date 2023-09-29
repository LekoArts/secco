import process from 'node:process'
import path from 'node:path'
import fs from 'fs-extra'
import { execaSync } from 'execa'
import destr from 'destr'
import { join } from 'pathe'
import { promisifiedSpawn } from '../utils/promisified-spawn'
import type { PackageJson } from '../types'
import { getSourcePackageJsonPath } from '../utils/file'
import { CLI_NAME } from '../constants'
import { logger } from '../utils/logger'
import { REGISTRY_URL } from './verdaccio-config'
import { registerCleanupTask } from './cleanup-tasks'
import type { PublishPackagesAndInstallArgs } from '.'

const NpmRcConfigKey = `${REGISTRY_URL.replace(/https?:/g, '')}/:_authToken`
const NpmRcContent = `${NpmRcConfigKey}="${CLI_NAME}"`

type AdjustPackageJsonArgs = Omit<PublishPackageArgs, 'source'> & {
  sourcePkgJsonPath: string
}

/**
 * Edit package.json to:
 * - Adjust version to temporary "secco" version
 * - Change version selectors for dependencies that will be published (to make sure they are installed)
 */
function adjustPackageJson({ sourcePkgJsonPath, packageName, packageNamesToFilePath, packagesToPublish, ignorePackageJsonChanges, versionPostfix }: AdjustPackageJsonArgs) {
  // Check if package depends on any other package that will be published. Adjust version selector to point to "secco" version so that local registry is used for those dependencies.

  const sourcePkgJsonString = fs.readFileSync(sourcePkgJsonPath, 'utf-8')
  const sourcePkgJson = destr<PackageJson>(sourcePkgJsonString)

  // Overwrite version with "secco" name
  sourcePkgJson.version = `${sourcePkgJson.version}-${CLI_NAME}-${versionPostfix}`

  packagesToPublish.forEach((pkgToPublish) => {
    if (sourcePkgJson.dependencies?.[pkgToPublish]) {
      const srcPath = getSourcePackageJsonPath(pkgToPublish, packageNamesToFilePath)

      if (!srcPath)
        return

      const currentVersion = destr<PackageJson>(fs.readFileSync(srcPath, 'utf-8'))?.version

      if (currentVersion)
        sourcePkgJson.dependencies[pkgToPublish] = `${currentVersion}-${CLI_NAME}-${versionPostfix}`
    }
  })

  const tempSourcePkgJsonString = JSON.stringify(sourcePkgJson)

  const revertIgnorePackageJsonChanges = ignorePackageJsonChanges(packageName, [sourcePkgJsonString, tempSourcePkgJsonString])

  fs.outputFileSync(sourcePkgJsonPath, tempSourcePkgJsonString)

  return {
    newPackageVersion: sourcePkgJson.version,
    revertAdjustPackageJson: registerCleanupTask(() => {
      // Restore original package.json file
      fs.outputFileSync(sourcePkgJsonPath, sourcePkgJsonString)
      revertIgnorePackageJsonChanges()
    }),
  }
}

interface CreateTempNpmRcArgs {
  pathToPkg: string
  sourcePath: string
}

/**
 * Anonymous publishing requires a dummy .npmrc file. This is a requirement for npm and yarn 🤷🏻‍♀️. Creates an .npmrc file in the source package directory and in the source directory. If an .npmrc file already exists, it will edit the file.
 */
function createTempNpmRc({ pathToPkg, sourcePath }: CreateTempNpmRcArgs) {
  const npmRcPathInPkg = join(pathToPkg, '.npmrc')
  const npmRcPathInSource = join(sourcePath, '.npmrc')
  let revertPkg = false
  let revertSource = false

  // If an .npmrc file already exists in the pkg and/or source root, we should use "npm config set key=value"

  if (fs.existsSync(npmRcPathInPkg)) {
    execaSync('npm', ['config', 'set', NpmRcContent], { cwd: pathToPkg })
    revertPkg = true
  }
  else { fs.outputFileSync(npmRcPathInPkg, NpmRcContent) }

  if (fs.existsSync(npmRcPathInSource)) {
    execaSync('npm', ['config', 'set', NpmRcContent], { cwd: sourcePath })
    revertSource = true
  }
  else { fs.outputFileSync(npmRcPathInSource, NpmRcContent) }

  return registerCleanupTask(() => {
    if (revertPkg)
      execaSync('npm', ['config', 'delete', NpmRcConfigKey], { cwd: pathToPkg })
    else
      fs.removeSync(npmRcPathInPkg)

    if (revertSource)
      execaSync('npm', ['config', 'delete', NpmRcConfigKey], { cwd: sourcePath })
    else
      fs.removeSync(npmRcPathInSource)
  })
}

type PublishPackageArgs = Omit<PublishPackagesAndInstallArgs, 'destinationPackages'> & {
  packageName: string
  versionPostfix: number
}

export async function publishPackage({ packageName, packagesToPublish, packageNamesToFilePath, versionPostfix, source, ignorePackageJsonChanges }: PublishPackageArgs) {
  const sourcePkgJsonPath = getSourcePackageJsonPath(packageName, packageNamesToFilePath)

  if (!sourcePkgJsonPath) {
    logger.fatal(`Couldn't find package.json for ${packageName} during publishing`)
    process.exit()
  }

  const { newPackageVersion, revertAdjustPackageJson } = adjustPackageJson({
    sourcePkgJsonPath,
    packageName,
    packageNamesToFilePath,
    versionPostfix,
    packagesToPublish,
    ignorePackageJsonChanges,
  })

  const pathToPkg = path.dirname(sourcePkgJsonPath)
  const revertCreateTempNpmRc = createTempNpmRc({ pathToPkg, sourcePath: source.path })

  logger.log(`Publishing \`${packageName}@${newPackageVersion}\` to local registry...`)

  try {
    await promisifiedSpawn(['npm', ['publish', '--tag', CLI_NAME, `--registry=${REGISTRY_URL}`], { cwd: pathToPkg }])

    logger.log(`Published \`${packageName}@${newPackageVersion}\` to local registry`)
  }
  catch (e) {
    if (e instanceof Error) {
      logger.fatal(`Failed to publish \`${packageName}@${newPackageVersion}\` to local registry`, e)
      process.exit()
    }
  }

  revertCreateTempNpmRc()
  revertAdjustPackageJson()

  return newPackageVersion
}
