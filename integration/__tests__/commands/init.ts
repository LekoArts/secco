import { createTempDir } from '../../helpers/files'
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
    const [_, logs] = SeccoCLI().setCwd(testDir).invoke(['init', '--source', input, '--yes'])

    logs.should.contain('Successfully created .seccorc')

    await cleanup()
  })
})
