import type { PackageJson } from '../types'
import type { AdjustPackageJsonArgs } from '../verdaccio'
import destr from 'destr'
import fs from 'fs-extra'
import { CLI_NAME } from '../constants'
import { getSourcePackageJsonPath } from '../utils/file'
import { registerCleanupTask } from '../verdaccio/cleanup-tasks'

/**
 * Edit package.json to:
 * - Adjust version to temporary "secco" version
 * - Change version selectors for dependencies that will be published (to make sure they are installed)
 */
export function adjustPackageJson({ sourcePkgJsonPath, packageName, packageNamesToFilePath, packagesToPublish, ignorePackageJsonChanges, versionPostfix }: AdjustPackageJsonArgs) {
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
