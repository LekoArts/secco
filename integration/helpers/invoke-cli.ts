import { join } from 'node:path'
import process from 'node:process'
import type { ExecaSyncError } from 'execa'
import { execaSync } from 'execa'
import strip from 'strip-ansi'
import { createLogsMatcher } from './matcher'

const builtCliLocation = join(__dirname, '..', '..', 'dist', 'cli.mjs')
const fixturesLocation = join(__dirname, '..', 'fixtures')

type CreateLogsMatcherReturn = ReturnType<typeof createLogsMatcher>
type InvokeResult = [exitCode: number, logsMatcher: CreateLogsMatcherReturn]

export function SeccoCLI() {
  let env: Record<string, string> = {}
  let cwd = ''

  const self = {
    setEnv: (_env: Record<string, string>) => {
      env = _env
      return self
    },
    setCwd: (_cwd: string) => {
      cwd = _cwd
      return self
    },
    invoke: (args: Array<string>): InvokeResult => {
      const NODE_ENV = 'production'

      try {
        const results = execaSync(
          process.execPath,
          [builtCliLocation].concat(args),
          {
            cwd: join(fixturesLocation, cwd),
            env: { NODE_ENV, ...env },
          },
        )
        return [
          results.exitCode,
          createLogsMatcher(strip(results.stderr.toString() + results.stdout.toString())),
        ]
      }
      catch (e) {
        const execaError = e as ExecaSyncError
        return [
          execaError.exitCode,
          createLogsMatcher(strip(execaError.stdout?.toString() || ``)),
        ]
      }
    },
  }

  return self
}

/*
export const SeccoCLI = {
  // Set environment variables
  setEnv(env: Record<string, string>): void {
    customEnv = env
  },
  from(relativeCwd: string) {
    return {
      // Run the CLI with the given arguments
      invoke(args: Array<string>): InvokeResult {
        const NODE_ENV = 'production'

        try {
          const results = execaSync(
            process.execPath,
            [builtCliLocation].concat(args),
            {
              cwd: join(fixturesLocation, relativeCwd),
              env: { NODE_ENV, ...customEnv },
            },
          )
          return [
            results.exitCode,
            createLogsMatcher(strip(results.stderr.toString() + results.stdout.toString())),
          ]
        }
        catch (e) {
          const execaError = e as ExecaSyncError
          return [
            execaError.exitCode,
            createLogsMatcher(strip(execaError.stdout?.toString() || ``)),
          ]
        }
      },
    }
  },
}
*/
