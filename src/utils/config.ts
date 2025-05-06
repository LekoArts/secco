import type { FlatErrors, InferOutput } from 'valibot'
import { isAbsolute } from 'node:path'
import process from 'node:process'
import { read, write } from 'rc9'
import {
  check,
  flatten,
  object,
  parse,
  pipe,
  safeParse,
  strictObject,
  string,
  trim,
  ValiError,
} from 'valibot'
import { CLI_NAME, CONFIG_FILE_NAME } from '../constants'
import { logger } from './logger'

const currentDir = process.cwd()

export const configOptions = {
  name: CONFIG_FILE_NAME,
  dir: currentDir,
  flat: false,
}

const EmptyObjectSchema = strictObject({})

export function isEmpty(input: unknown) {
  const result = safeParse(EmptyObjectSchema, input)
  return result.success
}

function logErrors(input: FlatErrors<typeof ConfigSchema>) {
  let listOfErrors: Array<string | null> = []

  if (input.nested?.['source.path']) {
    listOfErrors = Object.entries(input.nested).map(([key, value]) => {
      if (value) {
        return `- ${key}
${value
  .filter(Boolean)
  .map(t => `  - ${t}`)
  .join('\n')}`
      }

      return null
    })
  }

  logger.fatal(`Errors parsing your \`${CONFIG_FILE_NAME}\` file in ${configOptions.dir}

${listOfErrors.filter(Boolean).join('\n')}

Make sure that your \`${CONFIG_FILE_NAME}\` file only contains valid key/value pairs.`)

  process.exit()
}

export function sourcePathSchema(name: string) {
  return pipe(
    string(`\`${name}\` must be a string.`),
    trim(),
    check(
      input => isAbsolute(input),
      `\`${name}\` must be an absolute path.`,
    ),
  )
}

export const ConfigSchema = strictObject(
  {
    source: strictObject(
      {
        path: sourcePathSchema('source.path'),
      },
      'The key `source.path` is required and no other keys are allowed.',
    ),
  },
  'You must pass an object with a `source` key.',
)

const envSchema = object({
  SECCO_SOURCE_PATH: sourcePathSchema('SECCO_SOURCE_PATH'),
})

export type Config = InferOutput<typeof ConfigSchema>

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
  // Also error if unsafeConfig is falsy
  if (isEmpty(unsafeConfig) || !unsafeConfig) {
    logger.fatal(`No \`${CONFIG_FILE_NAME}\` file found in ${configOptions.dir}

Please run \`${CLI_NAME} init\` to create a new \`${CONFIG_FILE_NAME}\` file.
Alternatively you can define the required config through environment variables.`)

    process.exit()
  }

  let config = {} as Config

  try {
    config = parse(ConfigSchema, unsafeConfig)
  }
  catch (error) {
    if (error instanceof ValiError)
      logErrors(flatten(error.issues))
  }

  return config
}

export function setConfig(config: Config) {
  write(config, configOptions)
}
