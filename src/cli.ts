#!/usr/bin/env node

import process from 'node:process'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import pkg from '../package.json'
import { getConfig } from './utils/config'
import { logger } from './utils/logger'
import { commands } from './commands'
import { checkDirHasPackageJson } from './utils/initial-setup'

const input = hideBin(process.argv)

/*
The CLI interface is similar to https://cli.github.com/manual/gh.
You should be able to use secco like this:

- secco --version => Show version
- secco --help => Show help
- secco => Scan destination and copy files from source
- secco init => Create a new .seccorc file
- secco packages [packageNames...] => Scan destination and copy specific packages from source
*/

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

async function run() {
  const argv = await parser

  console.log({ argv })

  if (argv.verbose)
    logger.level = 4

  const seccoConfig = getConfig()
  logger.debug('Successfully loaded .seccorc file', seccoConfig)

  checkDirHasPackageJson()

  console.log({ seccoConfig })
}

run()
