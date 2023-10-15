import { getAddDependenciesCmd } from '../add-dependencies'
import { REGISTRY_URL } from '../verdaccio-config'

const registryUrlFlag = `--registry=${REGISTRY_URL}`

describe('getAddDependenciesCmd', () => {
  it('returns the correct command for npm', () => {
    const packages = ['package1', 'package2']
    const pm = { command: 'npm', name: 'npm' as any }
    const externalRegistry = false

    const result = getAddDependenciesCmd({ packages, pm, externalRegistry })

    expect(result).toEqual(['npm', ['install', 'package1', 'package2', '--save-exact', registryUrlFlag]])
  })

  it('returns the correct command for yarn', () => {
    const packages = ['package1', 'package2']
    const pm = { command: 'yarn', name: 'yarn' as any }
    const externalRegistry = false

    const result = getAddDependenciesCmd({ packages, pm, externalRegistry })

    expect(result).toEqual(['yarn', ['add', 'package1', 'package2', '--exact', registryUrlFlag]])
  })

  it('returns the correct command with external registry', () => {
    const packages = ['package1', 'package2']
    const pm = { command: 'npm', name: 'npm' as any }
    const externalRegistry = true

    const result = getAddDependenciesCmd({ packages, pm, externalRegistry })

    expect(result).toEqual(['npm', ['install', 'package1', 'package2', '--save-exact']])
  })
})
