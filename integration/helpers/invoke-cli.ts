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

export const SeccoCLI = {
  from(relativeCwd: string) {
    return {
      invoke(args: Array<string>): InvokeResult {
        const NODE_ENV = 'production'

        try {
          const results = execaSync(
            process.execPath,
            [builtCliLocation].concat(args),
            {
              cwd: join(fixturesLocation, relativeCwd),
              env: { NODE_ENV },
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
