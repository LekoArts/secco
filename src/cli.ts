#!/usr/bin/env node

import process from 'node:process'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import pkg from '../package.json'
import { getConfig } from './utils/config'
import { logger } from './utils/logger'
import { commands } from './commands'
import { checkDirHasPackageJson, getLocalPackages, getPackageNamesToFilePath, getPackages } from './utils/initial-setup'
import { CONFIG_FILE_NAME } from './constants'

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
    ['$0 packages ars aurea', 'Scan destination and copy specific packages from source'],
  ])
  .wrap(yargsInstace.terminalWidth())
  .showHelpOnFail(false)
  .parseAsync()

interface Arguments {
  scanOnce: boolean
  forceVerdaccio: boolean
  verbose: boolean
  packageNames?: Array<string>
}

async function run() {
  const argv: Arguments = await parser

  if (argv.verbose)
    logger.level = 4

  const seccoConfig = getConfig()
  logger.debug(`Successfully loaded ${CONFIG_FILE_NAME} file

${JSON.stringify(seccoConfig, null, 2)}`)

  checkDirHasPackageJson()

  const sourcePackages = getPackages({
    sourcePath: seccoConfig.source.path,
    sourceType: seccoConfig.source.type,
    sourceFolder: seccoConfig.source.folder,
  })
  logger.debug(`Found ${sourcePackages.length} packages in source.`)
  const packageNamesToFilePath = getPackageNamesToFilePath()
  const localPackages = getLocalPackages(sourcePackages)
  logger.debug(`Found ${localPackages.length} local packages.

${JSON.stringify(localPackages, null, 2)}`)

  if (!argv?.packageNames && localPackages.length === 0) {
    logger.error(`You haven't got any source dependencies in your current package.json.
You probably want to use the packages command to start developing. Example:

secco packages package-a package-b

If you only want to use \`secco\` you'll need to add the dependencies to your package.json`)

    if (!argv.forceVerdaccio)
      process.exit()

    else
      logger.info('Continuing other dependency installation due to \`--forceVerdaccio\` flag')
  }

  console.log({ packageNamesToFilePath })
}

run()
