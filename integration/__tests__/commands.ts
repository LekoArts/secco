import { SeccoCLI } from '../helpers/invoke-cli'
import { version as seccoVersion } from '../../package.json'

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
})

describe('--help', () => {
  it('should display usage overview', () => {
    const [exitCode, logs] = SeccoCLI().invoke(['--help'])

    logs.should.contain('Usage:')
    logs.should.contain('Options:')
    logs.should.contain('Examples:')
    expect(exitCode).toBe(0)
  })
})

describe('--version', () => {
  it('should display current CLI version', () => {
    const [exitCode, logs] = SeccoCLI().invoke(['--version'])

    logs.should.contain(seccoVersion)
    expect(exitCode).toBe(0)
  })
})
