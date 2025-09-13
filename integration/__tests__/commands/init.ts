import path from 'node:path'
import { fileExists } from 'verdaccio/build/lib/utils'
import { createTempDir, fileContainsText } from '../../helpers/files'
import { SeccoCLI } from '../../helpers/invoke-cli'

const initQuestion = 'What is the absolute path to your source?'
const warning = '.seccorc file already exists in this directory'

describe('init', () => {
  it('should work in directory without .seccorc file', () => {
    const [exitCode, logs] = SeccoCLI().setFixture('empty').invoke(['init'])

    logs.should.contain(initQuestion)
    logs.should.not.contain(warning)
    expect(exitCode).toBe(0)
  })
  it('should warn in directory with .seccorc file', () => {
    const [exitCode, logs] = SeccoCLI().setFixture('existing-config-file').invoke(['init'])

    logs.should.contain(initQuestion)
    logs.should.contain(warning)
    expect(exitCode).toBe(0)
  })
  it('should create config file after providing valid input', async () => {
    const [testDir, cleanup] = await createTempDir('init-command')
    const input = '/some/absolute/path/to/source'

    try {
      const [exitCode, logs] = SeccoCLI().setEnv({ TEST: undefined, VITEST: undefined, VITEST_MODE: undefined, VITEST_WORKER_ID: undefined, VITEST_POOL_ID: undefined }).setCwd(testDir).invoke(['init', '--source', input, '--yes'])

      logs.should.contain('Successfully created .seccorc')
      expect(exitCode).toBe(0)

      const file = await fileExists(path.join(testDir, '.seccorc'))
      expect(file).toBe(true)
      const contents = await fileContainsText(path.join(testDir, '.seccorc'), input)
      expect(contents).toBe(true)
    }
    finally {
      await cleanup()
    }
  })
  it('should error on invalid input', () => {
    const [exitCode, logs] = SeccoCLI().setFixture('empty').invoke(['init', '--source', 'relative-path', '--yes'])

    logs.should.contain('You need to provide an absolute path for the --source flag.')
    expect(exitCode).toBe(1)
  })
})
