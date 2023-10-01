import { readJsonSync } from 'fs-extra'
import { difference, intersection } from 'lodash-es'
import { join } from 'pathe'
import type { DepTree, PackageJson, PackageNamesToFilePath, SourcePackages } from '../types'
import { logger } from './logger'

interface TraversePackageDependenciesArgs {
  sourcePackages: SourcePackages
  packages: Array<string>
  packageNamesToFilePath: PackageNamesToFilePath
  seenPackages?: Array<string>
  depTree?: DepTree
}

export function traversePkgDeps({ sourcePackages, packages, packageNamesToFilePath, depTree = {}, seenPackages = [...packages] }: TraversePackageDependenciesArgs) {
  packages.forEach((p) => {
    let pkgJson!: PackageJson

    try {
      // Look up the absolute file path from the source location for that specific package
      const pkgRoot = packageNamesToFilePath.get(p)
      if (pkgRoot) {
        pkgJson = readJsonSync(join(pkgRoot, 'package.json'))
      }
      else {
        logger.error(`"${p}" doesn't exist in source location`)
        // Remove package from seenPackages
        seenPackages = seenPackages.filter(seenPkg => seenPkg !== p)
        return
      }
    }
    catch (e) {
      logger.error(`"${p}" doesn't exist in source location`, e)
      // Remove package from seenPackages
      seenPackages = seenPackages.filter(seenPkg => seenPkg !== p)
      return
    }

    // Look at the dependencies of the package. Create an intersection of the dependencies and the source packages
    const fromSource = intersection(Object.keys({ ...pkgJson.dependencies }), sourcePackages)

    // Build dependency tree by using the package name as the key and the dependencies as a Set
    fromSource.forEach((pkgName) => {
      depTree[pkgName] = (depTree[pkgName] || new Set()).add(p)
    })

    // Only traverse dependencies that are not already in seenPackages to avoid infinite loops
    const newPackages = difference(fromSource, seenPackages)

    if (newPackages.length > 0) {
      newPackages.forEach((depFromSource) => {
        seenPackages.push(depFromSource)
      })

      traversePkgDeps({
        packages: fromSource,
        sourcePackages,
        seenPackages,
        depTree,
        packageNamesToFilePath,
      })
    }
  })

  return { seenPackages, depTree }
}
