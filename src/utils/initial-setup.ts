import process from 'node:process'
import fs from 'fs-extra'
import intersection from 'lodash-es/intersection.js'
import merge from 'lodash-es/merge.js'
import { join } from 'pathe'
import { destr } from 'destr'
import { CONFIG_FILE_NAME } from '../constants'
import { logger } from './logger'
import type { Config } from './config'

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

export function getPackageNamesToFilePath() {
  return packageNameToFilePath
}

interface GetPackagesArgs {
  sourcePath: Config['source']['path']
  sourceType: Config['source']['type']
  sourceFolder?: Config['source']['folder']
}

/**
 * Go through the source folder and get all names of packages.
 * If the source is not a monorepo (=> single package), return an array with a single item.
 *
 * While iterating through the packages, save the package name and the absolute path to the packageNameToFilePath Map.
 */
export function getPackages({ sourcePath, sourceType, sourceFolder }: GetPackagesArgs) {
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
    if (!sourceFolder) {
      logger.fatal('`source.folder` is required when `source.type` is `monorepo`')
      process.exit()
    }

    // Get packagenames from sourceFolder
    const monorepoPackages = fs.readdirSync(join(sourcePath, sourceFolder)).map((dirName) => {
      // Try to get the package name from the package.json file
      try {
        const localPkg = destr<{ name?: string }>(fs.readFileSync(join(sourcePath, sourceFolder, dirName, 'package.json'), 'utf-8'))

        if (localPkg?.name) {
          packageNameToFilePath.set(localPkg.name, join(sourcePath, sourceFolder, dirName))
          return localPkg.name
        }
      }
      catch (error) {
        // fallback to directory name
      }

      packageNameToFilePath.set(dirName, join(sourcePath, sourceFolder, dirName))
      return dirName
    })

    return monorepoPackages
  }

  return []
}

export function getLocalPackages(sourcePackages: Array<string>) {
  const localPkgJson = destr<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(fs.readFileSync(join(currentDir, 'package.json'), 'utf-8'))

  if (!localPkgJson)
    return []

  // Intersect sourcePackages with local dependencies to get list of packages that are used
  const localPackages = intersection(
    sourcePackages,
    Object.keys(merge({}, localPkgJson.dependencies, localPkgJson.devDependencies)),
  )

  return localPackages
}
