import process from 'node:process'
import { isAbsolute } from 'node:path'
import { read, write } from 'rc9'
import { type Output, ValiError, enumType, object, parse, safeParse, strict, string, toTrimmed } from 'valibot'
import { logger } from './logger'

const currentDir = process.cwd()

export const configOptions = {
  name: '.seccorc',
  dir: currentDir,
  flat: false,
}

const EmptyObjectSchema = strict(object({}))

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

  logger.fatal(`Errors parsing your .seccorc file in ${configOptions.dir}

${listOfErrors.filter(Boolean).join('\n')}

Make sure that your .seccorc file only contains valid key/value pairs.`)

  process.exit(1)
}

const ConfigSchema = strict(object({
  source: strict(object({
    path: string('source.path is required and must be a string', [
      toTrimmed(),
      (input) => {
        // The source path must be an abssolute path
        if (!isAbsolute(input)) {
          return {
            issues: [
              {
                input,
                validation: 'custom',
                message: 'source.path must be an absolute path',
              },
            ],
          }
        }

        return { output: input }
      },
    ]),
    type: enumType(['single', 'monorepo'], 'source.type is required and must be either "single" or "monorepo"'),
  })),
}))

export type Config = Output<typeof ConfigSchema>

export function getConfig(): Config {
  const unsafeConfig = read<Partial<Config>>(configOptions)

  if (isEmpty(unsafeConfig)) {
    logger.fatal(`No .seccorc file found in ${configOptions.dir}

Please run \`secco init\` to create a new .seccorc file.`)

    process.exit(1)
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
