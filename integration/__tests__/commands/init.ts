import path from 'node:path'
import { createTempDir, fileContainsText, fileExists } from '../../helpers/files'
import { SeccoCLI } from '../../helpers/invoke-cli'

const nonInteractiveError = 'Can\'t create .seccorc without --source and --yes in non-interactive mode.'
const warning = '.seccorc file already exists in this directory'

describe('init', () => {
  it('should fail with the non-interactive command instead of prompting', () => {
    const [exitCode, logs] = SeccoCLI().setFixture('empty').invoke(['init'])

    logs.should.contain(nonInteractiveError)
    logs.should.contain('secco init --source <ABSOLUTE_PATH> --yes')
    logs.should.not.contain(warning)
    expect(exitCode).toBe(1)
  })
  it('should require --yes in non-interactive mode and keep the provided source', () => {
    const [exitCode, logs] = SeccoCLI().setFixture('empty').invoke(['init', '--source', '/path with space'])

    logs.should.contain(nonInteractiveError)
    logs.should.contain('secco init --source \'/path with space\' --yes')
    expect(exitCode).toBe(1)
  })
  it('should warn in directory with .seccorc file', () => {
    const [exitCode, logs] = SeccoCLI().setFixture('existing-config-file').invoke(['init'])

    logs.should.contain(warning)
    expect(exitCode).toBe(1)
  })
  it('should create config file after providing valid input', async () => {
    const [testDir, cleanup] = await createTempDir('init-command')
    const input = '/some/absolute/path/to/source'

    try {
      const [exitCode, logs] = SeccoCLI().setEnv({
        TEST: undefined,
        VITEST: undefined,
        VITEST_MODE: undefined,
        VITEST_WORKER_ID: undefined,
        VITEST_POOL_ID: undefined,
      }).setCwd(testDir).invoke(['init', '--source', input, '--yes'])

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
    const [exitCode, logs] = SeccoCLI().setFixture('empty').invoke([
      'init',
      '--source',
      'relative-path',
      '--yes',
    ])

    logs.should.contain('You need to provide an absolute path for the --source flag.')
    expect(exitCode).toBe(1)
  })
})
