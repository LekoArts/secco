import type { DepTree } from '../types'

interface getDependantPackagesArgs {
  packageName: string
  depTree: DepTree
  packagesToPublish?: Set<string>
}

export function getDependantPackages({ packageName, depTree, packagesToPublish = new Set() }: getDependantPackagesArgs) {
  // Bail early if package was already handled
  if (packagesToPublish.has(packageName))
    return packagesToPublish

  packagesToPublish.add(packageName)

  const dependants = depTree[packageName]
  if (dependants) {
    dependants.forEach((dependant) => {
      getDependantPackages({ packageName: dependant, depTree, packagesToPublish })
    })
  }

  return packagesToPublish
}
