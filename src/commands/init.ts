import { isAbsolute } from 'node:path'
import Enquirer from 'enquirer'
import { serialize } from 'rc9'
import { colors } from 'consola/utils'
import { type Config, setConfig } from '../utils/config'
import { logger } from '../utils/logger'

interface Answers {
  path: string
  type: 'single' | 'monorepo'
}

async function initialize() {
  const answers = await new Enquirer<Answers>().prompt([
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
    {
      type: 'select',
      name: 'type',
      message: 'What type of repository is your source?',
      choices: [
        {
          message: 'Single package',
          name: 'single',
          value: 'single',
        },
        {
          message: 'Monorepo with multiple packages',
          name: 'monorepo',
          value: 'monorepo',
        },
      ],
    },
  ])

  const configValues: Config = {
    source: {
      path: answers.path,
      type: answers.type,
    },
  }

  // To display the options in the last screen, use serialize and split the output on new line
  const options = serialize(configValues)

  logger.info(`${colors.bold('Thanks! Your .seccorc file will contain the following options:')}

${options}

`)

  const { confirm } = await new Enquirer<{ confirm: boolean }>().prompt({
    type: 'confirm',
    name: 'confirm',
    initial: 'Yes',
    message: 'Shall we do this?',
    format: value => (value ? colors.greenBright('Yes') : colors.red('No')),
  })

  if (!confirm) {
    logger.info('Ok, bye!')
    return
  }

  setConfig(configValues)

  logger.success('Successfully created .seccorc file')
}

export const command = 'init'
export const desc = 'Initialize a new .seccorc file'
export const builder = {}
export const handler = initialize
