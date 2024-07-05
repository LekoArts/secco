import type { PackageJson } from '../types'

interface SetNpmTagInDepsArgs {
  packageJson: PackageJson
  packagesToInstall: Array<string>
  newlyPublishedPackageVersions: Record<string, string>
}

interface AdjustDepsArgs {
  deps: PackageJson['dependencies'] | PackageJson['devDependencies'] | PackageJson['peerDependencies']
  packagesToInstall: Array<string>
  newlyPublishedPackageVersions: Record<string, string>
}

/**
 * Traverse the dependencies object and adjust the versions of the packages that are to be installed.
 * Use the newlyPublishedPackageVersions object so that the local registry is used for those dependencies.
 *
 * @returns {boolean} Whether the dependencies object was changed
 */
export function adjustDeps({ deps, packagesToInstall, newlyPublishedPackageVersions }: AdjustDepsArgs) {
  if (!deps)
    return false

  let changed = false

  Object.keys(deps).forEach((depName) => {
    if (packagesToInstall.includes(depName)) {
      deps[depName] = newlyPublishedPackageVersions[depName]
      changed = true
    }
  })

  return changed
}

/**
 * When the destination uses workspaces, the dependencies/devDependencies/peerDependencies versions of source packages need to be changed to the newly published package versions.
 * Once this work is done, a mere `npm install` will install the packages from the local registry.
 */
export function setNpmTagInDeps({ packageJson, packagesToInstall, newlyPublishedPackageVersions }: SetNpmTagInDepsArgs) {
  // Make a new object to avoid mutating the original package.json
  const pkgJson = { ...packageJson }
  let changed = false

  // Adjust all dependencies. If any of them are changed, `changed` should be set to true
  changed = adjustDeps({ deps: pkgJson.dependencies, packagesToInstall, newlyPublishedPackageVersions }) || changed
  changed = adjustDeps({ deps: pkgJson.devDependencies, packagesToInstall, newlyPublishedPackageVersions }) || changed
  changed = adjustDeps({ deps: pkgJson.peerDependencies, packagesToInstall, newlyPublishedPackageVersions }) || changed

  return {
    updatedPkgJson: pkgJson,
    changed,
  }
}
