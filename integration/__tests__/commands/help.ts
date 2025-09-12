import { SeccoCLI } from '../../helpers/invoke-cli'

describe('--help', () => {
  it('should display usage overview', () => {
    const [exitCode, logs] = SeccoCLI().invoke(['--help'])

    logs.should.contain('Usage:')
    logs.should.contain('Options:')
    logs.should.contain('Examples:')
    expect(exitCode).toBe(0)
  })
})
