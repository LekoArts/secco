import { readFile, readFileSync } from 'fs-extra'
import fetch from 'node-fetch'
import { isEqual, isObject, transform, uniq } from 'lodash-es'
import destr from 'destr'
import { CLI_NAME, NPM_DIST_TAG } from '../constants'
import type { PackageJson, PackageNamesToFilePath, SourcePackages } from '../types'
import { getPackageVersion, getSourcePackageJsonPath } from './file'
import { logger } from './logger'

type ObjWithAny = Record<string, any>

export function difference(object: ObjWithAny, base: ObjWithAny) {
  function changes(object: ObjWithAny, base: ObjWithAny) {
    return transform(object, (result: ObjWithAny, value, key) => {
      if (!isEqual(value, base[key])) {
        result[key]
          = isObject(value) && isObject(base[key])
            ? changes(value, base[key])
            : value
      }
    })
  }
  return changes(object, base)
}

interface CheckDependencyChangesArgs {
  nodeModulesFilePath: string
  packageName: string
  sourcePackages: SourcePackages
  ignoredPackageJson: Map<string, Array<string>>
  packageNamesToFilePath: PackageNamesToFilePath
  isInitialScan: boolean
}

/**
 * Go through the process of figuring out if both source and destination package.json files exist.
 * If they do, compare the dependencies and see what changed. Create a changelog of the changes.
 */
export async function checkDepsChanges(args: CheckDependencyChangesArgs) {
  let nodeModulePkgJson: PackageJson
  let pkgNotInstalled = false

  try {
    // The package might already be installed (e.g. the "latest" version)
    // nodeModulesFilePath might not exist, but this is okay since we catch the resulting error
    nodeModulePkgJson = destr<PackageJson>(readFileSync(args.nodeModulesFilePath, 'utf8'))
  }
  catch {
    pkgNotInstalled = true
    // Didn't find the package in node_modules, so secco should install the package for users. But only on the first run/scan.
    if (!args.isInitialScan) {
      logger.info(`\`${args.packageName}\` does not seem to be installed. Restart ${CLI_NAME} to publish it.`)

      return {
        didDepsChange: false,
        pkgNotInstalled,
      }
    }

    // If the package is not installed, try to fetch the package.json file from unpkg.com. This way secco can check if the local package is different from the one on npm.
    // This can potentially save some time as secco doesn't need to publish this package to the local registry then.
    try {
      const version = getPackageVersion(args.packageName)
      const url = `https://unpkg.com/${args.packageName}@${version}/package.json`
      const res = await fetch(url)

      if (res?.status !== 200)
        throw new Error(`No response or Non-200 response from ${url}`)

      nodeModulePkgJson = await res.json() as PackageJson
    }
    catch (e) {
      if (e instanceof Error)
        logger.error(`\`${args.packageName}\` does not seem to be installed and is also not published on npm. Error: ${e.message}`)

      return {
        didDepsChange: true,
        pkgNotInstalled,
      }
    }
  }

  const sourcePkgJsonPath = getSourcePackageJsonPath(args.packageName, args.packageNamesToFilePath)

  if (!sourcePkgJsonPath) {
    return {
      didDepsChange: false,
      pkgNotInstalled,
    }
  }

  const sourcePkgJsonString = await readFile(sourcePkgJsonPath, 'utf8')
  const sourcePkgJson = destr<PackageJson>(sourcePkgJsonString)

  if (args.ignoredPackageJson.has(args.packageName)) {
    if (args.ignoredPackageJson.get(args.packageName)?.includes(sourcePkgJsonString)) {
      // This state is in the middle of publishing and the contents of package.json are set during publish. So return early here to not cause false positives.

      return {
        didDepsChange: false,
        pkgNotInstalled,
      }
    }
  }

  if (!sourcePkgJson.dependencies)
    sourcePkgJson.dependencies = {}
  if (!nodeModulePkgJson.dependencies)
    nodeModulePkgJson.dependencies = {}

  const areDepsEqual = isEqual(sourcePkgJson.dependencies, nodeModulePkgJson.dependencies)

  if (!areDepsEqual) {
    const diff = difference(sourcePkgJson.dependencies, nodeModulePkgJson.dependencies)
    const diff2 = difference(nodeModulePkgJson.dependencies, sourcePkgJson.dependencies)

    let needsPublishing = false
    let isPublishing = false

    const uniqueDepskeys = uniq(Object.keys({ ...diff, ...diff2 }))
    const depsChangelog: Array<string> = []

    // Create a changelog of the dependencies that changed
    for (const key of uniqueDepskeys) {
      if (sourcePkgJson.dependencies[key] === NPM_DIST_TAG) {
        // If secco is in the middle of publishing to local registry - ignore
        isPublishing = true
        continue
      }

      if (nodeModulePkgJson.dependencies[key] === NPM_DIST_TAG) {
        // In destination repository the dependency will have the secco dist tag, we need to ignore changes for that
        continue
      }

      if (
        nodeModulePkgJson.dependencies[key]
        && sourcePkgJson.dependencies[key]
      ) {
        // This code path is for version changes in packages that are not in the source repository (so e.g. any third-party dependency). Changes in source will be copied over. And if those contain other dependency changes, they'll also be covered.
        if (!args.sourcePackages.includes(key)) {
          depsChangelog.push(
            ` - \`${key}\` changed version from ${nodeModulePkgJson.dependencies[key]} to ${sourcePkgJson.dependencies[key]}`,
          )
          needsPublishing = true
        }
      }
      else if (sourcePkgJson.dependencies[key]) {
        depsChangelog.push(` - \`${key}@${sourcePkgJson.dependencies[key]}\` was added`)
        needsPublishing = true
      }
      else {
        depsChangelog.push(` - \`${key}@${nodeModulePkgJson.dependencies[key]}\` was removed`)
        // This doesn't need publishing, skipping
      }
    }

    if (!isPublishing && depsChangelog.length > 0) {
      logger.log(`Dependencies of \`${args.packageName}\` changed:\n${depsChangelog.join('\n')}`)

      if (args.isInitialScan)
        logger.info(`Will ${!needsPublishing ? 'not ' : ''}publish to local registry.`)

      else
        logger.warn(`Installation of dependencies after initial scan is not supported in ${CLI_NAME}.`)

      return {
        didDepsChange: needsPublishing,
        pkgNotInstalled,
      }
    }
  }

  return {
    didDepsChange: false,
    pkgNotInstalled,
  }
}
