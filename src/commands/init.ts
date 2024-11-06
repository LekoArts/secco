import type { Source } from '../types'
import { isAbsolute } from 'node:path'
import process from 'node:process'
import { colors } from 'consola/utils'
import Enquirer from 'enquirer'
import { serialize } from 'rc9'
import { CONFIG_FILE_NAME } from '../constants'
import { type Config, setConfig } from '../utils/config'
import { hasConfigFile } from '../utils/initial-setup'
import { logger } from '../utils/logger'

type RequiredSourceConfig = Pick<Source, 'path'>

/**
 * When running `secco init` we want to ask the user a few questions to create a new config file.
 * Warns if the file already exists.
 */
async function initialize() {
  if (hasConfigFile())
    logger.warn(`${CONFIG_FILE_NAME} file already exists in this directory. If you continue this wizard the file will be overwritten.`)

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

  const configValues: Config = {
    source: {
      path: requiredQuestions.path,
    },
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
    process.exit()
  }

  setConfig(configValues)

  logger.success(`Successfully created ${CONFIG_FILE_NAME}`)
  process.exit()
}

export const command = 'init'
export const desc = `Initialize a new ${CONFIG_FILE_NAME} file`
export const builder = {}
export const handler = initialize
