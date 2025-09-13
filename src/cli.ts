#!/usr/bin/env node

import type { ArgumentsCamelCase } from 'yargs'
import type { CliArguments } from './types'
import process from 'node:process'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { initialize } from './commands/init'
import { CONFIG_FILE_NAME } from './constants'
import { main } from './main'

const input = hideBin(process.argv)
const yargsInstace = yargs(input)

yargsInstace
  .usage('Usage: $0 <command>')
  .command(
    '$0',
    'Scan destination and copy files from source',
    () => {},
    async (argv: ArgumentsCamelCase<CliArguments>) => {
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
        description: 'Skip confirmation prompts',
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
    ['$0 packages ars aurea', 'Copy specified packages from source to destination'],
    ['$0 init --source=/absolute/path --yes', 'Create a .seccorc file in the current dir with the provided source path without any prompts'],
  ])
  .wrap(yargsInstace.terminalWidth())
  .showHelpOnFail(false)
  .detectLocale(false)
  .parseAsync()
