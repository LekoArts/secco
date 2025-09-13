import type { ArgumentsCamelCase } from 'yargs'
import type { CliArguments, Destination, Source } from './types'
import process from 'node:process'
import { detectPackageManager } from 'nypm'
import { CLI_NAME } from './constants'
import { getConfig } from './utils/config'
import { checkDirHasPackageJson, findWorkspacesInDestination, findWorkspacesInSource, getAbsolutePathsForDestinationPackages, getDestinationPackages, getPackageNamesToFilePath, getPackages } from './utils/initial-setup'
import { isTruthy } from './utils/is-truthy'
import { logger } from './utils/logger'
import { watcher } from './watcher'

export async function main(argv: ArgumentsCamelCase<CliArguments>) {
  const verbose = argv.verbose || isTruthy(process.env.VERBOSE)

  if (verbose)
    logger.level = 4

  const seccoConfig = getConfig()
  logger.debug(`Successfully loaded configuration:

${JSON.stringify(seccoConfig, null, 2)}`)

  checkDirHasPackageJson()

  const destinationPath = process.cwd()

  const { source: sourceConfig } = seccoConfig
  const { hasWorkspaces: sourceHasWorkspaces, workspaces: sourceWorkspaces } = findWorkspacesInSource(sourceConfig.path)
  const { hasWorkspaces: destinationHasWorkspaces, workspaces: destinationWorkspaces } = findWorkspacesInDestination(destinationPath)

  const pmSource = await detectPackageManager(sourceConfig.path, { includeParentDirs: false })
  const pmDestination = await detectPackageManager(destinationPath, { includeParentDirs: false })

  if (!pmDestination) {
    logger.fatal(`Failed to detect package manager in ${destinationPath}

If you have control over the destination, manually add the "packageManager" key to its \`package.json\` file.`)
    process.exit(1)
  }

  logger.debug(`Detected package manager in source: ${pmSource?.name}`)
  logger.debug(`Detected package manager in destination: ${pmDestination?.name}`)
  logger.debug(`Source has workspaces: ${sourceHasWorkspaces}`)
  logger.debug(`Destination has workspaces: ${destinationHasWorkspaces}`)

  const sourcePackages = getPackages(sourceConfig.path, sourceWorkspaces)
  logger.debug(`Found ${sourcePackages.length} ${sourcePackages.length === 1 ? 'package' : 'packages'} in source.`)
  const packageNamesToFilePath = getPackageNamesToFilePath()
  const destinationPackages = getDestinationPackages(sourcePackages, destinationWorkspaces)
  const absolutePathsForDestinationPackages = getAbsolutePathsForDestinationPackages()
  logger.debug(`Found ${destinationPackages.length} ${destinationPackages.length === 1 ? 'package' : 'packages'} in destination.`)

  if (!argv?.packageNames && destinationPackages.length === 0) {
    logger.error(`You haven't got any source dependencies in your current \`package.json\`.
You probably want to use the packages command to start developing. Example:

${CLI_NAME} packages package-a package-b

If you only want to use \`${CLI_NAME}\` you'll need to add the dependencies to your \`package.json\`.`)

    if (!argv.forceVerdaccio)
      process.exit(1)

    else
      logger.info('Continuing other dependency installation due to \`--force-verdaccio\` flag')
  }

  const source: Source = {
    ...sourceConfig,
    hasWorkspaces: sourceHasWorkspaces,
    packages: sourcePackages,
    packageNamesToFilePath,
    pm: pmSource,
  }

  const destination: Destination = {
    packages: destinationPackages,
    hasWorkspaces: destinationHasWorkspaces,
    absolutePathsForDestinationPackages,
    pm: pmDestination,
  }

  watcher(source, destination, argv.packageNames, { scanOnce: argv.scanOnce, forceVerdaccio: argv.forceVerdaccio, verbose })
}
