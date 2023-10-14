import { SeccoCLI } from '../helpers/invoke-cli'

describe('init', () => {
  it('should work in directory without .seccorc file', () => {
    const [exitCode, logs] = SeccoCLI.from('empty').invoke(['init'])

    logs.should.contain('What is the absolute path to your source?')
    logs.should.not.contain('.seccorc file already exists in this directory')
    expect(exitCode).toBe(0)
  })
  it('should warn in directory with .seccorc file', () => {
    const [exitCode, logs] = SeccoCLI.from('existing-config-file').invoke(['init'])

    logs.should.contain('What is the absolute path to your source?')
    logs.should.contain('.seccorc file already exists in this directory')
    expect(exitCode).toBe(0)
  })
})
