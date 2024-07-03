import { join } from 'node:path'
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises'

import { tmpdir } from 'node:os'
import { CONFIG_FILE_NAME } from '../../src/constants'
import { type InvokeResult, SeccoCLI } from './invoke-cli'

const fixtureLocation = join(__dirname, '..', 'fixtures', 'kitchen-sink')

async function createSeccoRcFile(cwd: string) {
  await writeFile(join(cwd, 'destination', CONFIG_FILE_NAME), `source.path="${join(cwd, 'source')}"`, { encoding: 'utf-8' })
}

function cli({ cwd, args, options }: { cwd: string, args: Array<string>, options?: CliOptions }) {
  const { verbose = false } = options || {}

  return SeccoCLI().setCwd(join(cwd, 'destination')).setEnv({
    VERBOSE: verbose ? 'true' : 'false',
  }).invoke(args)
}

interface CliOptions {
  verbose?: boolean
}

export interface SetupReturn {
  cwd: string
  cli: (args: Array<string>, options?: CliOptions) => InvokeResult
  cleanup: () => Promise<void>
}

export function KitchenSink() {
  let cwd = ''

  const self = {
    setup: async () => {
      // Create temporary directory to isolate fixture
      cwd = await mkdtemp(join(tmpdir(), 'secco-integration-test-'))

      // Copy fixture directory to temporary directory
      await cp(fixtureLocation, cwd, { recursive: true })

      // Create a secco config file in the temporary directory
      await createSeccoRcFile(cwd)

      return {
        cwd,
        cli: (args: Array<string>, options?: CliOptions) => cli({ cwd, args, options }),
        cleanup: async () => {
          // Remove temporary directory created in the setup function
          await rm(cwd, { recursive: true, force: true })
        },
      }
    },
  }

  return self
}
