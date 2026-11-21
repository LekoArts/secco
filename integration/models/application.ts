import type { InvokeResult } from '../helpers/invoke-cli'
import type { ApplicationConfig } from './application-config'
import { rm } from 'node:fs/promises'
import { join } from 'pathe'
import { isTruthy } from '../../src/utils/is-truthy'
import { SeccoCLI } from '../helpers/invoke-cli'
import { createLogger } from '../helpers/logger'

export type Application = ReturnType<typeof application>

interface CliOptions {
  verbose?: boolean
}

export function application(config: ApplicationConfig, isolatedDir: string) {
  const { name, packageManager } = config
  const logger = createLogger({ prefix: name })
  // Isolate per app: Verdaccio storage lives in os.tmpdir() (parallel test files would wipe each other's registry) and keep npm away from the developer's ~/.npmrc
  const isolatedEnv = {
    TMPDIR: join(isolatedDir, 'tmp'),
    NPM_CONFIG_USERCONFIG: join(isolatedDir, 'user.npmrc'),
  }

  const self = {
    name,
    dir: isolatedDir,
    packageManager,
    cli: (args: Array<string>, options?: CliOptions): InvokeResult => {
      const { verbose = false } = options || {}

      return SeccoCLI().setCwd(join(isolatedDir, 'destination')).setEnv({
        ...isolatedEnv,
        VERBOSE: verbose ? 'true' : 'false',
      }).invoke(args)
    },
    watch: (args: Array<string> = []) => {
      return SeccoCLI().setCwd(join(isolatedDir, 'destination')).setEnv({ ...isolatedEnv, VERBOSE: 'true' }).spawn(args)
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
