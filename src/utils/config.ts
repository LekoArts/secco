import process from 'node:process'
import { isAbsolute } from 'node:path'
import { read, write } from 'rc9'
import { type Output, ValiError, never, object, parse, safeParse, string, toTrimmed } from 'valibot'
import { CLI_NAME, CONFIG_FILE_NAME } from '../constants'
import { logger } from './logger'

const currentDir = process.cwd()

export const configOptions = {
  name: CONFIG_FILE_NAME,
  dir: currentDir,
  flat: false,
}

const EmptyObjectSchema = object({}, never())

function isEmpty(input: unknown) {
  const result = safeParse(EmptyObjectSchema, input)
  return result.success
}

function logErrors(input: ValiError['issues']) {
  // Generate an array of all errors from input
  const listOfErrors = input.map((value) => {
    if (value)
      return `- ${value.message}`

    return null
  })

  logger.fatal(`Errors parsing your ${CONFIG_FILE_NAME} file in ${configOptions.dir}

${listOfErrors.filter(Boolean).join('\n')}

Make sure that your ${CONFIG_FILE_NAME} file only contains valid key/value pairs.`)

  process.exit()
}

function sourcePathSchema(name: string) {
  return string(`${name} is required and must be a string`, [
    toTrimmed(),
    (input) => {
    // The source path must be an abssolute path
      if (!isAbsolute(input)) {
        return {
          issues: [
            {
              input,
              validation: 'custom',
              message: `${name} must be an absolute path`,
            },
          ],
        }
      }

      return { output: input }
    },
  ])
}

const ConfigSchema = object({
  source: object({
    path: sourcePathSchema('source.path'),
  }, never()),
}, never())

const envSchema = object({
  SECCO_SOURCE_PATH: sourcePathSchema('SECCO_SOURCE_PATH'),
})

export type Config = Output<typeof ConfigSchema>

/**
 * Tries to load the config values from process.env and .seccorc file.
 * Fails the process if neither of them are found.
 */
export function getConfig(): Config {
  // 1. Try to load the values from process.env. If they are not found, continue to step 2.
  try {
    const ENV = parse(envSchema, process.env)

    return {
      source: {
        path: ENV.SECCO_SOURCE_PATH,
      },
    }
  }
  catch {
    // Do nothing
  }

  // 2. Try to read the values from a .seccorc file
  const unsafeConfig = read<Partial<Config>>(configOptions)

  // If the file doesn't exist, the unsafeConfig will be an empty object
  if (isEmpty(unsafeConfig)) {
    logger.fatal(`No ${CONFIG_FILE_NAME} file found in ${configOptions.dir}

Please run \`${CLI_NAME} init\` to create a new ${CONFIG_FILE_NAME} file.
Alternatively you can define the required config through environment variables.`)

    process.exit()
  }

  let config = {} as Config

  try {
    config = parse(ConfigSchema, unsafeConfig)
  }
  catch (error) {
    if (error instanceof ValiError)
      logErrors(error.issues)
  }

  return config
}

export function setConfig(config: Config) {
  write(config, configOptions)
}
