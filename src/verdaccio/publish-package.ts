import process from 'node:process'
import path from 'node:path'
import fs from 'fs-extra'
import destr from 'destr'
import { join } from 'pathe'
import { promisifiedSpawn } from '../utils/promisified-spawn'
import type { PackageJson } from '../utils/file'
import { getSourcePackageJsonPath } from '../utils/file'
import { CLI_NAME } from '../constants'
import { logger } from '../utils/logger'
import type { Config } from '../utils/config'
import { REGISTRY_URL } from './verdaccio-config'
import { registerCleanupTask } from './cleanup-tasks'

const NpmRcContent = `${REGISTRY_URL.replace(/https?:/g, '')}/:_authToken="${CLI_NAME}"`

interface AdjustPackageJsonArgs {
  sourcePkgJsonPath: string
  packageName: string
  packageNamesToFilePath: Map<string, string>
  versionPostfix: number
  packagesToPublish: Array<string>
  ignorePackageJsonChanges: (packageName: string, contentArray: Array<string>) => () => void
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
 * Anonymous publishing requires a dummy .npmrc file. This is a requirement for npm and yarn 🤷🏻‍♀️
 */
function createTempNpmRc({ pathToPkg, sourcePath }: CreateTempNpmRcArgs) {
  // TODO(feature): If .npmrc already exists, recover that file

  const npmRcPathInPkg = join(pathToPkg, '.npmrc')
  fs.outputFileSync(npmRcPathInPkg, NpmRcContent)

  const npmRcPathInSource = join(sourcePath, '.npmrc')
  fs.outputFileSync(npmRcPathInSource, NpmRcContent)

  return registerCleanupTask(() => {
    fs.removeSync(npmRcPathInPkg)
    fs.removeSync(npmRcPathInSource)
  })
}

interface PublishPackageArgs {
  packageName: string
  packagesToPublish: Array<string>
  packageNamesToFilePath: Map<string, string>
  versionPostfix: number
  ignorePackageJsonChanges: (packageName: string, contentArray: Array<string>) => () => void
  source: Config['source']
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
      logger.fatal(`Failed to publish \`${packageName}@${newPackageVersion}\` to local registry.`, e)
      process.exit()
    }
  }

  revertCreateTempNpmRc()
  revertAdjustPackageJson()

  return newPackageVersion
}
