import type { PublishPackageArgs } from '.'
import path from 'node:path'
import process from 'node:process'
import { CLI_NAME } from '../constants'
import { adjustPackageJson } from '../utils/adjust-package-json'
import { createTempNpmRc } from '../utils/create-temp-npm-rc'
import { getSourcePackageJsonPath } from '../utils/file'
import { logger } from '../utils/logger'
import { promisifiedSpawn } from '../utils/promisified-spawn'
import { REGISTRY_URL } from './verdaccio-config'

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
