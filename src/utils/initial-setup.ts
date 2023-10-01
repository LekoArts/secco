import process from 'node:process'
import { existsSync, readFileSync } from 'fs-extra'
import { intersection, merge } from 'lodash-es'
import { findWorkspaces } from 'find-workspaces'
import { join } from 'pathe'
import { destr } from 'destr'
import { CONFIG_FILE_NAME } from '../constants'
import type { Source, SourcePackages } from '../types'
import { logger } from './logger'

const currentDir = process.cwd()

export function checkDirHasPackageJson() {
  const packageJsonPath = `${currentDir}/package.json`
  const hasFile = existsSync(packageJsonPath)

  if (!hasFile) {
    logger.fatal(`No \`package.json\` found in ${currentDir}

Current directory must contain a \`package.json\` file.`)
    process.exit()
  }
}

export function findWorkspacesInSource(sourcePath: Source['path']) {
  const workspaces = findWorkspaces(sourcePath)

  return {
    hasWorkspaces: Boolean(workspaces),
    workspaces,
  }
}

export function hasConfigFile() {
  const configPath = join(currentDir, CONFIG_FILE_NAME)
  return existsSync(configPath)
}

const packageNameToFilePath = new Map<string, string>()

/**
 * Returns a map (package name to absolute file path) of packages inside the source repository
 */
export function getPackageNamesToFilePath() {
  return packageNameToFilePath
}

/**
 * Go through the source folder and get all names of packages.
 *
 * First, figure out if the source folder has workspaces set up (it means it's a monorepo).
 * Second, depending on that return the name of the package.json or go through the package.json files inside the workspaces.
 * In any case, the returned value is an array.
 *
 * While iterating through the packages, save the package name and the absolute path to the packageNameToFilePath Map.
 */
export function getPackages(sourcePath: Source['path'], workspaces: ReturnType<typeof findWorkspacesInSource>['workspaces']) {
  // If workspaces is an empty Array or null, it means it's not a monorepo
  if (!workspaces) {
    const pkgJsonPath = readFileSync(join(sourcePath, 'package.json'), 'utf-8')
    const pkgJson = destr<{ name?: string }>(pkgJsonPath)

    if (pkgJson?.name) {
      packageNameToFilePath.set(pkgJson.name, sourcePath)
      return [pkgJson.name]
    }

    return []
  }

  if (workspaces.length > 0) {
    const monorepoPackages = workspaces.map((workspace) => {
      const absolutePath = workspace.location
      const pkgJson = workspace.package

      packageNameToFilePath.set(pkgJson.name, absolutePath)

      return pkgJson.name
    })

    return monorepoPackages
  }

  return []
}

export function getDestinationPackages(sourcePackages: SourcePackages) {
  const destPkgJson = destr<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(readFileSync(join(currentDir, 'package.json'), 'utf-8'))

  if (!destPkgJson)
    return []

  // Intersect sourcePackages with destination dependencies to get list of packages that are used
  const destinationPackages = intersection(
    sourcePackages,
    Object.keys(merge({}, destPkgJson.dependencies, destPkgJson.devDependencies)),
  )

  return destinationPackages
}
