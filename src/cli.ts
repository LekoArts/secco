#!/usr/bin/env node

import process from 'node:process'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { detectPackageManager } from 'nypm'
import { getConfig } from './utils/config'
import { logger } from './utils/logger'
import { commands } from './commands'
import { checkDirHasPackageJson, findWorkspacesInSource, getDestinationPackages, getPackageNamesToFilePath, getPackages } from './utils/initial-setup'
import type { CliArguments, Destination, Source } from './types'
import { CLI_NAME } from './constants'
import { watcher } from './watcher'
import { isTruthy } from './utils/is-truthy'

const input = hideBin(process.argv)
const yargsInstace = yargs(input)

const parser = yargsInstace
  .usage('Usage: $0 <command>')
  .command(commands)
  .option('scan-once', {
    type: 'boolean',
    default: false,
    description: 'Scan source once and do not start file watching',
  })
  .option('force-verdaccio', {
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
  ])
  .wrap(yargsInstace.terminalWidth())
  .showHelpOnFail(false)
  .detectLocale(false)
  .parseAsync()

async function run() {
  const argv: CliArguments = await parser

  if (argv.verbose || isTruthy(process.env.VERBOSE))
    logger.level = 4

  const seccoConfig = getConfig()
  logger.debug(`Successfully loaded configuration:

${JSON.stringify(seccoConfig, null, 2)}`)

  checkDirHasPackageJson()

  const { source: sourceConfig } = seccoConfig
  const { hasWorkspaces, workspaces } = findWorkspacesInSource(sourceConfig.path)
  const pm = await detectPackageManager(sourceConfig.path, { includeParentDirs: false })
  logger.debug(`Detected package manager in source: ${pm?.name}`)
  logger.debug(`Source has workspaces: ${hasWorkspaces}`)

  const sourcePackages = getPackages(sourceConfig.path, workspaces)
  logger.debug(`Found ${sourcePackages.length} packages in source.`)
  const packageNamesToFilePath = getPackageNamesToFilePath()
  const destinationPackages = getDestinationPackages(sourcePackages)
  logger.debug(`Found ${destinationPackages.length} destination packages.`)

  if (!argv?.packageNames && destinationPackages.length === 0) {
    logger.error(`You haven't got any source dependencies in your current \`package.json\`.
You probably want to use the packages command to start developing. Example:

${CLI_NAME} packages package-a package-b

If you only want to use \`${CLI_NAME}\` you'll need to add the dependencies to your \`package.json\`.`)

    if (!argv.forceVerdaccio)
      process.exit()

    else
      logger.info('Continuing other dependency installation due to \`--force-verdaccio\` flag')
  }

  const source: Source = {
    ...sourceConfig,
    hasWorkspaces,
    packages: sourcePackages,
    packageNamesToFilePath,
    pm,
  }

  const destination: Destination = {
    packages: destinationPackages,
  }

  watcher(source, destination, argv.packageNames, { scanOnce: argv.scanOnce, forceVerdaccio: argv.forceVerdaccio, verbose: argv.verbose })
}

run()
