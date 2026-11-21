import { SeccoCLI } from '../../helpers/invoke-cli'

describe('--help', () => {
  it('should display usage overview', () => {
    const [exitCode, logs] = SeccoCLI().invoke(['--help'])

    logs.should.contain('Usage:')
    logs.should.contain('Options:')
    logs.should.contain('Examples:')
    expect(exitCode).toBe(0)
  })

  it('should name the CLI and document its environment variables', () => {
    const [exitCode, logs] = SeccoCLI().invoke(['-h'])

    logs.should.contain('secco init')
    logs.should.contain('SECCO_SOURCE_PATH')
    expect(exitCode).toBe(0)
  })
})

describe('unknown command', () => {
  it('should fail instead of running the default command', () => {
    const [exitCode, logs] = SeccoCLI().setFixture('empty').invoke(['frobnicate'])

    logs.should.contain('Unknown command: frobnicate')
    logs.should.not.contain('.seccorc')
    expect(exitCode).toBe(1)
  })
})
