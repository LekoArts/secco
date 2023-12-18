import { join } from 'node:path'
import { SeccoCLI } from '../helpers/invoke-cli'

const missingSourcePackagesLocation = join(__dirname, '..', 'fixtures', 'missing-source-packages')

describe('missing .seccorc', () => {
  it('should display error when no .seccorc or env var is found', () => {
    const [exitCode, logs] = SeccoCLI().setCwd('empty').invoke([''])

    logs.should.contain('No `.seccorc` file found in')
    logs.should.contain('Please run `secco init` to create a new `.seccorc` file.')
    expect(exitCode).toBe(0)
  })
})

describe('missing package.json', () => {
  it('should display error when no package.json is found', () => {
    const [exitCode, logs] = SeccoCLI().setCwd('existing-config-file').invoke([''])

    logs.should.contain('No `package.json` found in')
    logs.should.contain('Current directory must contain a `package.json` file.')
    expect(exitCode).toBe(0)
  })
})

describe('missing source packages', () => {
  it('should display error when no source package is found in package.json', () => {
    const [exitCode, logs] = SeccoCLI().setCwd('missing-source-packages').setEnv({ SECCO_SOURCE_PATH: missingSourcePackagesLocation }).invoke([''])

    logs.should.contain(`You haven't got any source dependencies in your current \`package.json\`.`)
    logs.should.contain(`If you only want to use \`secco\` you'll need to add the dependencies to your \`package.json\`.`)
    expect(exitCode).toBe(0)
  })
})
