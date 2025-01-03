import type { PackageJson, Source, SourcePackages } from '../types'
import process from 'node:process'
import { destr } from 'destr'
import { findWorkspaces } from 'find-workspaces'
import fs from 'fs-extra'
import { intersection, merge } from 'lodash-es'
import { join } from 'pathe'
import { CONFIG_FILE_NAME } from '../constants'
import { logger } from './logger'

const currentDir = process.cwd()

export function checkDirHasPackageJson() {
  const packageJsonPath = `${currentDir}/package.json`
  const hasFile = fs.existsSync(packageJsonPath)

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

export function findWorkspacesInDestination(destinationPath: string) {
  const workspaces = findWorkspaces(destinationPath)

  return {
    hasWorkspaces: Boolean(workspaces),
    workspaces,
  }
}

export function hasConfigFile() {
  const configPath = join(currentDir, CONFIG_FILE_NAME)
  return fs.existsSync(configPath)
}

export function isPrivate(pkgJson: PackageJson) {
  return Boolean(pkgJson.private)
}

const packageNameToFilePath = new Map<string, string>()
const absolutePathsForDestinationPackages = new Set<string>()

/**
 * Returns a Map (package name to absolute file path) of packages inside the source repository
 */
export function getPackageNamesToFilePath() {
  return packageNameToFilePath
}

/**
 * Returns a Set of absolute paths to packages inside destination that use source packages.
 * Will be later used to only modify the package.json files that are actually using the source packages.
 */
export function getAbsolutePathsForDestinationPackages() {
  return absolutePathsForDestinationPackages
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
    let pkgJsonPath = ''

    try {
      pkgJsonPath = fs.readFileSync(join(sourcePath, 'package.json'), 'utf-8')
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (e) {
      logger.fatal(`Couldn't find package.json in ${sourcePath}. Make sure that the source.path inside \`${CONFIG_FILE_NAME}\` is correct.`)

      process.exit()
    }

    const pkgJson = destr<PackageJson>(pkgJsonPath)

    if (pkgJson?.name) {
      if (isPrivate(pkgJson)) {
        logger.info(`Skipping private package \`${pkgJson.name}\`. If you need to use it, remove the \`private\` flag from its package.json file.`)
        return []
      }

      packageNameToFilePath.set(pkgJson.name, sourcePath)
      return [pkgJson.name]
    }

    return []
  }

  if (workspaces.length > 0) {
    const monorepoPackages = workspaces.map((workspace) => {
      const absolutePath = workspace.location
      const pkgJson = workspace.package

      if (isPrivate(pkgJson)) {
        logger.info(`Skipping private package \`${pkgJson.name}\`. If you need to use it, remove the \`private\` flag from its package.json file.`)
        return null
      }

      packageNameToFilePath.set(pkgJson.name, absolutePath)

      return pkgJson.name
    })

    return monorepoPackages.filter(Boolean)
  }

  return []
}

export function getDestinationPackages(sourcePackages: SourcePackages, workspaces: ReturnType<typeof findWorkspacesInSource>['workspaces']) {
  if (!workspaces) {
    const destPkgJson = destr<{ dependencies?: Record<string, string>, devDependencies?: Record<string, string>, name: string }>(fs.readFileSync(join(currentDir, 'package.json'), 'utf-8'))

    if (!destPkgJson)
      return []

    // Intersect sourcePackages with destination dependencies to get list of packages that are used
    const deps = intersection(
      sourcePackages,
      Object.keys(merge({}, destPkgJson.dependencies, destPkgJson.devDependencies)),
    )

    if (deps.length > 0) {
      absolutePathsForDestinationPackages.add(currentDir)
    }

    return deps
  }

  if (workspaces.length > 0) {
    return workspaces.map((workspace) => {
      const absolutePath = workspace.location
      const pkgJson = workspace.package

      const deps = intersection(
        sourcePackages,
        Object.keys(merge({}, pkgJson.dependencies, pkgJson.devDependencies)),
      )

      if (deps.length > 0) {
        absolutePathsForDestinationPackages.add(absolutePath)
      }

      return deps
    }).flat()
  }

  return []
}
