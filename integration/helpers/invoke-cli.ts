import type { ExecaSyncError } from 'execa'
import process from 'node:process'
import { execaSync } from 'execa'
import { join } from 'pathe'
import strip from 'strip-ansi'
import { createLogsMatcher } from './matcher'

const builtCliLocation = join(__dirname, '..', '..', 'dist', 'cli.mjs')
const fixturesLocation = join(__dirname, '..', 'fixtures')

type CreateLogsMatcherReturn = ReturnType<typeof createLogsMatcher>
export type InvokeResult = [exitCode: number | undefined, logsMatcher: CreateLogsMatcherReturn]

export function SeccoCLI() {
  let env: Record<string, string> = {}
  let cwd = ''
  let cliLocation = builtCliLocation
  let input = ''

  const self = {
    setEnv: (_env: Record<string, string>) => {
      env = _env
      return self
    },
    setCwd: (_cwd: string) => {
      cwd = _cwd
      return self
    },
    setFixture: (_fixture: string) => {
      cwd = join(fixturesLocation, _fixture)
      return self
    },
    setCliLocation: (_cliLocation: string) => {
      cliLocation = _cliLocation
      return self
    },
    setInput: (_input: string) => {
      input = _input
      return self
    },
    invoke: (args: Array<string>): InvokeResult => {
      const NODE_ENV = 'production'

      try {
        const results = execaSync(
          process.execPath,
          [cliLocation].concat(args),
          {
            cwd,
            env: { NODE_ENV, ...env },
            input,
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
          createLogsMatcher(strip((execaError.stderr?.toString() || ``) + (execaError.stdout?.toString() || ``))),
        ]
      }
    },
  }

  return self
}
