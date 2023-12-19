import { join } from 'node:path'
import crypto from 'node:crypto'
import { copyFile, cp, rm } from 'node:fs/promises'

// import { cp, mkdtemp, rm } from 'node:fs/promises'
// import { tmpdir } from 'node:os'
import { write } from 'rc9'
import { CONFIG_FILE_NAME } from '../../src/constants'
import { type InvokeResult, SeccoCLI } from './invoke-cli'

const builtCliLocation = join(__dirname, '..', '..', 'dist', 'cli.mjs')
const fixtureLocation = join(__dirname, '..', 'fixtures', 'kitchen-sink')

function createSeccoRcFile(cwd: string) {
  write({
    source: {
      path: join(cwd, 'source'),
    },
  }, {
    name: CONFIG_FILE_NAME,
    dir: join(cwd, 'destination'),
    flat: false,
  })
}

function cli({ cwd, args, options }: { cwd: string, args: Array<string>, options?: CliOptions }) {
  const { verbose = false } = options || {}

  return SeccoCLI().setCliLocation(join(cwd, 'cli.mjs')).setCwd(join(cwd, 'destination')).setEnv({
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
      // cwd = await mkdtemp(join(tmpdir(), 'secco-integration-test-'))
      cwd = join(__dirname, '..', `temp-tests-${crypto.randomUUID()}`)

      // Copy fixture directory to temporary directory
      await cp(fixtureLocation, cwd, { recursive: true })

      // Copy built CLI to root of temporary directory
      await copyFile(builtCliLocation, join(cwd, 'cli.mjs'))

      // Create a secco config file in the temporary directory
      createSeccoRcFile(cwd)

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
