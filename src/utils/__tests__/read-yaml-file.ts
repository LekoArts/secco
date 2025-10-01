import path from 'node:path'
import { readYamlFile } from '../read-yaml-file'

interface PnpmWorkspace {
  packages: Array<string>
  catalogs: Record<string, Record<string, string>>
}

describe('readYamlFile', () => {
  const fixtureFilePath = path.join(__dirname, 'fixtures', 'fixture.pnpm-workspace.yaml')

  it('should read and parse YAML file', () => {
    const result = readYamlFile<PnpmWorkspace>(fixtureFilePath)

    expect(result).toEqual({
      packages: ['packages/*'],
      catalogs: {
        sindre: {
          'pretty-ms': '9.2.0',
        },
        default: {
          'tslib': '2.4.1',
          'is-stream': '4.0.1',
        },
      },
    })
  })
})
