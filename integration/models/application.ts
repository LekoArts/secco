import { rm } from 'node:fs/promises'
import { join } from 'pathe'
import type { InvokeResult } from '../helpers/invoke-cli'
import { SeccoCLI } from '../helpers/invoke-cli'
import { createLogger } from '../helpers/logger'
import { isTruthy } from '../../src/utils/is-truthy'
import type { ApplicationConfig } from './application-config'

export type Application = ReturnType<typeof application>

interface CliOptions {
  verbose?: boolean
}

export function application(config: ApplicationConfig, isolatedDir: string) {
  const { name, packageManager } = config
  const logger = createLogger({ prefix: name })

  const self = {
    name,
    dir: isolatedDir,
    packageManager,
    cli: (args: Array<string>, options?: CliOptions): InvokeResult => {
      const { verbose = false } = options || {}

      return SeccoCLI().setCwd(join(isolatedDir, 'destination')).setEnv({
        VERBOSE: verbose ? 'true' : 'false',
      }).invoke(args)
    },
    cleanup: async () => {
      if (isTruthy(process.env.CI)) {
        logger.log(`Skipping cleanup in CI environment`)
        return
      }

      logger.log(`Cleaning up...`)

      await rm(isolatedDir, { recursive: true, force: true })
    },
  }

  return self
}
