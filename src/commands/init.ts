import type { ArgumentsCamelCase, Argv } from 'yargs'
import type { Source } from '../types'
import type { Config } from '../utils/config'
import { isAbsolute } from 'node:path'
import process from 'node:process'
import { colors } from 'consola/utils'
import Enquirer from 'enquirer'
import { serialize } from 'rc9'
import { CONFIG_FILE_NAME } from '../constants'
import { setConfig } from '../utils/config'
import { hasConfigFile } from '../utils/initial-setup'
import { logger } from '../utils/logger'

type RequiredSourceConfig = Pick<Source, 'path'>

interface InitArgs {
  source?: string
  yes?: boolean
}

/**
 * When running `secco init` we want to ask the user a few questions to create a new config file.
 * Warns if the file already exists.
 */
async function initialize(argv: ArgumentsCamelCase<InitArgs>) {
  if (hasConfigFile())
    logger.warn(`${CONFIG_FILE_NAME} file already exists in this directory. If you continue this wizard the file will be overwritten.`)

  let sourcePath: string

  if (argv?.source) {
    if (!isAbsolute(argv.source)) {
      logger.fatal('You need to provide an absolute path for the --source flag.')
      process.exit(1)
    }
    sourcePath = argv.source
  }
  else {
    const requiredQuestions = await new Enquirer<RequiredSourceConfig>().prompt([
      {
        type: 'input',
        name: 'path',
        message: 'What is the absolute path to your source?',
        validate: (input) => {
          if (!isAbsolute(input))
            return 'You need to use an absolute path'

          return true
        },
      },
    ])
    sourcePath = requiredQuestions.path
  }

  const configValues: Config = {
    source: {
      path: sourcePath,
    },
  }

  if (argv?.yes) {
    setConfig(configValues)
    logger.success(`Successfully created ${CONFIG_FILE_NAME}`)
    return
  }

  const optionsToDisplay = serialize(configValues)

  logger.info(`${colors.bold('Thanks!')}
Your ${CONFIG_FILE_NAME} file will contain the following options:

${optionsToDisplay}
`)

  const { confirm } = await new Enquirer<{ confirm: boolean }>().prompt({
    type: 'confirm',
    name: 'confirm',
    initial: 'Yes',
    message: 'Do you want to create the file?',
    format: value => (value ? colors.greenBright('Yes') : colors.red('No')),
  })

  if (!confirm) {
    logger.info('Ok, bye!')
    return
  }

  setConfig(configValues)

  logger.success(`Successfully created ${CONFIG_FILE_NAME}`)
}

export const command = 'init'
export const desc = `Initialize a new ${CONFIG_FILE_NAME} file`
export function builder(yargs: Argv): Argv<InitArgs> {
  return yargs.options({
    source: {
      type: 'string',
      description: 'Absolute path to the source directory',
    },
    yes: {
      type: 'boolean',
      description: 'Skip confirmation prompts',
    },
  })
}
export const handler = initialize
