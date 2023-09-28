import process from 'node:process'
import fs from 'fs-extra'
import { intersection, merge } from 'lodash-es'
import { join } from 'pathe'
import { destr } from 'destr'
import { CONFIG_FILE_NAME } from '../constants'
import type { Source, SourcePackages } from '../types'
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

export function hasConfigFile() {
  const configPath = join(currentDir, CONFIG_FILE_NAME)
  return fs.existsSync(configPath)
}

const packageNameToFilePath = new Map<string, string>()

/**
 * Returns a map (package name to absolute file path) of packages inside the source repository
 */
export function getPackageNamesToFilePath() {
  return packageNameToFilePath
}

interface GetPackagesArgs {
  sourcePath: Source['path']
  sourceType: Source['type']
  sourceFolders?: Source['folders']
}

/**
 * Go through the source folder and get all names of packages.
 * If the source is not a monorepo (=> single package), return an array with a single item.
 *
 * While iterating through the packages, save the package name and the absolute path to the packageNameToFilePath Map.
 */
export function getPackages({ sourcePath, sourceType, sourceFolders }: GetPackagesArgs) {
  if (sourceType === 'single') {
    const pkgJsonPath = fs.readFileSync(join(sourcePath, 'package.json'), 'utf-8')
    const pkgJson = destr<{ name?: string }>(pkgJsonPath)

    if (pkgJson?.name) {
      packageNameToFilePath.set(pkgJson.name, sourcePath)
      return [pkgJson.name]
    }

    return []
  }

  if (sourceType === 'monorepo') {
    if (!sourceFolders) {
      logger.fatal('`source.folders` is required when `source.type` is `monorepo`')
      process.exit()
    }

    // Users can provide multiple folders that they want to watch in their monorepo. Iterate through the source.folders and then collect the package names from each folder in a global monorepoPackages array.
    const monorepoPackages = sourceFolders.flatMap((folder) => {
      const monorepoPackageNames = fs.readdirSync(join(sourcePath, folder)).map((dirName) => {
        // Try to get the package name from the package.json file
        try {
          const localPkg = destr<{ name?: string }>(fs.readFileSync(join(sourcePath, folder, dirName, 'package.json'), 'utf-8'))

          if (localPkg?.name) {
            packageNameToFilePath.set(localPkg.name, join(sourcePath, folder, dirName))
            return localPkg.name
          }
        }
        catch (error) {
          // fallback to directory name
        }

        packageNameToFilePath.set(dirName, join(sourcePath, folder, dirName))
        return dirName
      })

      return monorepoPackageNames
    })

    return monorepoPackages
  }

  return []
}

export function getDestinationPackages(sourcePackages: SourcePackages) {
  const destPkgJson = destr<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(fs.readFileSync(join(currentDir, 'package.json'), 'utf-8'))

  if (!destPkgJson)
    return []

  // Intersect sourcePackages with destination dependencies to get list of packages that are used
  const destinationPackages = intersection(
    sourcePackages,
    Object.keys(merge({}, destPkgJson.dependencies, destPkgJson.devDependencies)),
  )

  return destinationPackages
}
