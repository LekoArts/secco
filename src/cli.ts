#!/usr/bin/env node

import type { ArgumentsCamelCase } from 'yargs'
import type { CliArguments } from './types'
import process from 'node:process'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { initialize } from './commands/init'
import { CLI_NAME, CONFIG_FILE_NAME } from './constants'
import { main } from './main'
import { logger } from './utils/logger'

const input = hideBin(process.argv)
const yargsInstace = yargs(input)

yargsInstace
  .scriptName(CLI_NAME)
  .usage('Usage: $0 <command>')
  .command(
    '$0',
    'Scan destination and copy files from source',
    () => {},
    async (argv: ArgumentsCamelCase<CliArguments>) => {
      // The default command takes no positionals, so anything here is a mistyped command
      // Empty strings come from scripts like `secco "$FLAGS"` and stay allowed
      const unknown = argv._.filter(arg => arg !== '')
      if (unknown.length > 0) {
        logger.fatal(`Unknown command: ${unknown.join(' ')}

See the available commands:
  ${CLI_NAME} --help`)
        process.exit(1)
      }
      await main(argv)
    },
  )
  .command(
    'packages [packageNames...]',
    'Specify list of packages you want to link',
    y => y.positional('packageNames', {
      describe: 'Names of packages to link',
      type: 'string',
      array: true,
    }),
    async (argv: ArgumentsCamelCase<CliArguments>) => {
      await main(argv)
    },
  )
  .command(
    'init',
    `Initialize a new ${CONFIG_FILE_NAME} file`,
    y => y.options({
      source: {
        type: 'string',
        description: 'Absolute path to the source directory',
      },
      yes: {
        type: 'boolean',
        description: 'Skip confirmation prompts (required in non-interactive mode)',
      },
    }),
    initialize,
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
    ['$0 --scan-once', 'Copy once and exit, e.g. in CI or scripts'],
    ['$0 packages ars aurea', 'Copy specified packages from source to destination'],
    ['$0 init --source=/absolute/path --yes', 'Create a .seccorc file in the current dir with the provided source path without any prompts'],
  ])
  .epilogue(`Environment variables:
  SECCO_SOURCE_PATH     Absolute path to the source, used instead of ${CONFIG_FILE_NAME}
  SECCO_VERDACCIO_PORT  Port of the local Verdaccio registry (default: 4873)
  VERBOSE               Same as --verbose

Learn more: https://secco.lekoarts.de`)
  .alias('help', 'h')
  .alias('version', 'v')
  .wrap(yargsInstace.terminalWidth())
  .showHelpOnFail(false)
  .detectLocale(false)
  .parseAsync()
