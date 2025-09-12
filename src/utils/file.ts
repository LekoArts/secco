import type { PackageJson } from '../types'
import { destr } from 'destr'
import fs from 'fs-extra'
import { join } from 'pathe'

export async function pathExists(p: string) {
  try {
    await fs.access(p)
    return true
  }
  catch {
    return false
  }
}

/**
 * Reads the package.json file in the current working directory and returns the version of the given package name.
 * Falls back to 'latest' if no version is found.
 */
export function getPackageVersion(packageName: string) {
  const pkgJson = destr<PackageJson>(fs.readFileSync('./package.json', 'utf8'))

  const { dependencies = {}, devDependencies = {} } = pkgJson
  const version = dependencies[packageName] || devDependencies[packageName]

  return version || 'latest'
}

/**
 * Returns the path to the package.json file of the given package name inside the source repository.
 */
export function getSourcePackageJsonPath(packageName: string, packageNamesToFilePath: Map<string, string>) {
  const packagePath = packageNamesToFilePath.get(packageName)
  if (!packagePath)
    return null

  return join(packagePath, 'package.json')
}

const packageJsonCache = new Map<string, PackageJson | undefined>()

/**
 * Get the package.json content for a given package path
 */
export function getPackageJson(packagePath: string) {
  if (!packageJsonCache.has(packagePath)) {
    const packageJsonPath = join(packagePath, 'package.json')
    const pkgJson = destr<PackageJson>(fs.readFileSync(packageJsonPath, 'utf8'))
    packageJsonCache.set(packagePath, pkgJson)
  }

  return packageJsonCache.get(packagePath)
}
