import type { PackageJson } from '../types'
import type { AdjustPackageJsonArgs } from '../verdaccio'
import destr from 'destr'
import fs from 'fs-extra'
import { CLI_NAME } from '../constants'
import { getSourcePackageJsonPath } from '../utils/file'
import { registerCleanupTask } from '../verdaccio/cleanup-tasks'
import { getCatalogsFromWorkspaceManifest, readWorkspaceManifest } from './pnpm'

/**
 * Edit package.json to:
 * - Adjust version to temporary "secco" version
 * - Change version selectors for dependencies that will be published (to make sure they are installed)
 * - Adjust 'workspace:*' versions to 'latest' (if pnpm is used with workspaces)
 * - Adjust 'catalog:' versions to versions defined in workspace (if pnpm is used with workspaces)
 */
export function adjustPackageJson({ sourcePkgJsonPath, packageName, packageNamesToFilePath, packagesToPublish, ignorePackageJsonChanges, versionPostfix, source }: AdjustPackageJsonArgs) {
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

  if (source?.pm?.name === 'pnpm' && source.hasWorkspaces) {
    // Adjust 'workspace:*' versions to 'latest'
    Object.entries(sourcePkgJson.dependencies ?? {}).forEach(([depName, depVersion]) => {
      if (depVersion === 'workspace:*' && sourcePkgJson.dependencies) {
        sourcePkgJson.dependencies[depName] = 'latest'
      }
    })

    // Read the pnpm-workspace.yaml file to check if catalogs are defined
    // If catalogs are defined, adjust 'catalog:' versions to versions defined in workspace

    const workspaceManifest = readWorkspaceManifest(source.path)
    const catalogs = getCatalogsFromWorkspaceManifest(workspaceManifest)

    // Adjust 'catalog:' and 'catalog:default' versions
    if (catalogs.default) {
      Object.entries(sourcePkgJson.dependencies ?? {}).forEach(([depName, depVersion]) => {
        if (depVersion === 'catalog:' || depVersion === 'catalog:default') {
          if (sourcePkgJson.dependencies && catalogs?.default?.[depName]) {
            sourcePkgJson.dependencies[depName] = `${catalogs.default[depName]}`
          }
        }
      })
    }

    // Adjust 'catalog:<name>' versions, if they exist
    Object.entries(sourcePkgJson.dependencies ?? {}).forEach(([depName, depVersion]) => {
      if (depVersion.startsWith('catalog:')) {
        const catalogName = depVersion.split(':')[1]
        if (sourcePkgJson.dependencies && catalogs[catalogName]?.[depName]) {
          sourcePkgJson.dependencies[depName] = `${catalogs[catalogName][depName]}`
        }
      }
    })
  }

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
