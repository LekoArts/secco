import process from 'node:process'
import type { Options } from 'execa'
import { execa } from 'execa'
import { CLI_NAME } from '../constants'
import { logger } from './logger'

type Writeable<T> = { -readonly [P in keyof T]: T[P] }

const defaultSpawnArgs: Writeable<Options> = {
  cwd: process.cwd(),
  stdio: 'inherit',
}

export function setDefaultSpawnStdio(stdio: Options['stdio']) {
  defaultSpawnArgs.stdio = stdio
}

export type PromisifiedSpawnArgs = [string, Array<string>, Options?]

export async function promisifiedSpawn([cmd, args = [], spawnArgs = {}]: PromisifiedSpawnArgs) {
  const spawnOptions = { ...defaultSpawnArgs, ...spawnArgs }

  try {
    return await execa(cmd, args, spawnOptions)
  }
  catch (e) {
    if (spawnOptions.stdio === 'ignore') {
      logger.log(
        `\nCommand "${cmd} ${args.join(
          ' ',
        )}" failed.\nTo see details of failed command, rerun \`${CLI_NAME}\` with \`--verbose\` flag.\n`,
      )
    }
    throw e
  }
}
