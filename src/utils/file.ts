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

export interface PackageJson {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  workspaces?: Array<string> | { packages: Array<string> }
}

export function readPackageJson(dir: string) {
  const file = join(dir, 'package.json')
  if (fs.existsSync(file))
    return destr<PackageJson>(fs.readFileSync(file, 'utf8'))

  return null
}

/**
 * Reads the package.json file in the current working directory and returns the version of the given package name.
 * Falls back to 'latest' if no version is found.
 */
export function getPackageVersion(packageName: string) {
  const pkgJson = readPackageJson('./')
  if (!pkgJson)
    return 'latest'

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
