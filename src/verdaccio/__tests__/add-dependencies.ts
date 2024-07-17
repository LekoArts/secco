import { getAddDependenciesCmd, getInstallCmd } from '../add-dependencies'
import { REGISTRY_URL } from '../verdaccio-config'

const registryUrlFlag = `--registry=${REGISTRY_URL}`

describe('getAddDependenciesCmd', () => {
  it('returns the correct command for npm', () => {
    const packages = ['package1', 'package2']
    const pm = { command: 'npm', name: 'npm' as any }

    const result = getAddDependenciesCmd({ packages, pm })

    expect(result).toEqual(['npm', ['install', 'package1', 'package2', '--save-exact', registryUrlFlag], { env: {} }])
  })

  it('returns the correct command for yarn', () => {
    const packages = ['package1', 'package2']
    const pm = { command: 'yarn', name: 'yarn' as any }

    const result = getAddDependenciesCmd({ packages, pm })

    expect(result).toEqual(['yarn', ['add', 'package1', 'package2', '--exact', registryUrlFlag], { env: {} }])
  })

  it('returns the correct command for pnpm', () => {
    const packages = ['package1', 'package2']
    const pm = { command: 'pnpm', name: 'pnpm' as any }

    const result = getAddDependenciesCmd({ packages, pm })

    expect(result).toEqual(['pnpm', ['add', 'package1', 'package2', '--save-exact', registryUrlFlag], { env: {} }])
  })

  it('returns the correct command for bun', () => {
    const packages = ['package1', 'package2']
    const pm = { command: 'bun', name: 'bun' as any }
    const externalRegistry = true

    const result = getAddDependenciesCmd({ packages, pm, externalRegistry })

    expect(result).toEqual(['bun', ['add', 'package1', 'package2', '--exact'], { env: {} }])
  })

  it('returns the correct command with external registry', () => {
    const packages = ['package1', 'package2']
    const pm = { command: 'npm', name: 'npm' as any }
    const externalRegistry = true

    const result = getAddDependenciesCmd({ packages, pm, externalRegistry })

    expect(result).toEqual(['npm', ['install', 'package1', 'package2', '--save-exact'], { env: {} }])
  })

  it('supports passing environment variables', () => {
    const packages = ['package1', 'package2']
    const pm = { command: 'npm', name: 'npm' as any }
    const env = { SOME_ENV_VAR: 'some-value' }

    const result = getAddDependenciesCmd({ packages, pm, env })

    expect(result).toEqual(['npm', ['install', 'package1', 'package2', '--save-exact', registryUrlFlag], { env }])
  })
})

describe('getInstallCmd', () => {
  it('should return the correct command for npm', () => {
    const pm = { name: 'npm' as const, command: 'npm' }
    const expectedCmd = ['npm', ['install', registryUrlFlag], { env: {} }]
    expect(getInstallCmd({ pm })).toEqual(expectedCmd)
  })

  it('should return the correct command for pnpm', () => {
    const pm = { name: 'pnpm' as const, command: 'pnpm' }
    const expectedCmd = ['pnpm', ['install', registryUrlFlag], { env: {} }]
    expect(getInstallCmd({ pm })).toEqual(expectedCmd)
  })

  it('should return the correct command for yarn', () => {
    const pm = { name: 'yarn' as const, command: 'yarn' }
    const expectedCmd = ['yarn', ['install', registryUrlFlag], { env: {} }]
    expect(getInstallCmd({ pm })).toEqual(expectedCmd)
  })

  it('should return the correct command for bun', () => {
    const pm = { name: 'bun' as const, command: 'bun' }
    const expectedCmd = ['bun', ['install', registryUrlFlag], { env: {} }]
    expect(getInstallCmd({ pm })).toEqual(expectedCmd)
  })

  it('should return the correct command with external registry', () => {
    const pm = { name: 'npm' as const, command: 'npm' }
    const expectedCmd = ['npm', ['install'], { env: {} }]
    expect(getInstallCmd({ pm, externalRegistry: true })).toEqual(expectedCmd)
  })

  it('should return the correct command with custom environment variables', () => {
    const pm = { name: 'npm' as const, command: 'npm' }
    const env = { NODE_ENV: 'production' }
    const expectedCmd = ['npm', ['install', registryUrlFlag], { env }]
    expect(getInstallCmd({ pm, env })).toEqual(expectedCmd)
  })
})
