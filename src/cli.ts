#!/usr/bin/env node

import type { ArgumentsCamelCase } from 'yargs'
import type { CliArguments, Destination, Source } from './types'
import process from 'node:process'
import { detectPackageManager } from 'nypm'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { commands } from './commands'
import { CLI_NAME } from './constants'
import { getConfig } from './utils/config'
import { checkDirHasPackageJson, findWorkspacesInDestination, findWorkspacesInSource, getAbsolutePathsForDestinationPackages, getDestinationPackages, getPackageNamesToFilePath, getPackages } from './utils/initial-setup'
import { isTruthy } from './utils/is-truthy'
import { logger } from './utils/logger'
import { watcher } from './watcher'

const input = hideBin(process.argv)
const yargsInstace = yargs(input)

yargsInstace
  .usage('Usage: $0 <command>')
  .command(commands)
  .command(
    '$0',
    'Scan destination and copy files from source',
    () => {},
    async (argv: ArgumentsCamelCase<CliArguments>) => {
      await run(argv)
    },
  )
  .option('scan-once', {
    alias: 's',
    type: 'boolean',
    default: false,
    description: 'Scan source once and do not start file watching',
  })
  .option('force-verdaccio', {
    alias: 'f',
    type: 'boolean',
    default: false,
    description: 'Disable file copying/watching and force usage of Verdaccio',
  })
  // Standard verbose option
  .option('verbose', {
    type: 'boolean',
    default: false,
    description: 'Output verbose logging',
  })
  // Some examples on how to use secco
  .example([
    ['$0', 'Scan destination and copy files from source'],
    ['$0 packages ars aurea', 'Copy specified packages from source to destination'],
    ['$0 init --source=/absolute/path --yes', 'Create a .seccorc file in the current dir with the provided source path without any prompts'],
  ])
  .wrap(yargsInstace.terminalWidth())
  .showHelpOnFail(false)
  .detectLocale(false)
  .parseAsync()

async function run(argv: ArgumentsCamelCase<CliArguments>) {
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
