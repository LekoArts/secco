import { SeccoCLI } from '../helpers/invoke-cli'

const initQuestion = 'What is the absolute path to your source?'
const warning = '.seccorc file already exists in this directory'

describe('init', () => {
  it('should work in directory without .seccorc file', () => {
    const [exitCode, logs] = SeccoCLI.from('empty').invoke(['init'])

    logs.should.contain(initQuestion)
    logs.should.not.contain(warning)
    expect(exitCode).toBe(0)
  })
  it('should warn in directory with .seccorc file', () => {
    const [exitCode, logs] = SeccoCLI.from('existing-config-file').invoke(['init'])

    logs.should.contain(initQuestion)
    logs.should.contain(warning)
    expect(exitCode).toBe(0)
  })
})
