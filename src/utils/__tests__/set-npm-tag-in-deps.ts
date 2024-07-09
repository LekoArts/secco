import { adjustDeps, setNpmTagInDeps } from '../set-npm-tag-in-deps'

const TEST_VERSION = '1.0.0-test-09833'

describe('adjustDeps', () => {
  it('should return false if the dependencies object is empty', () => {
    const result = adjustDeps({ deps: {}, packagesToInstall: ['package1', 'package2'], newlyPublishedPackageVersions: {} })
    expect(result).toBe(false)
  })

  it('should update the versions of packages to be installed', () => {
    const deps = {
      package1: '1.0.0',
      package2: '2.0.0',
      package3: '3.0.0',
    }
    const result = adjustDeps({ deps, packagesToInstall: ['package1', 'package3'], newlyPublishedPackageVersions: { package1: TEST_VERSION, package3: TEST_VERSION } })

    expect(result).toBe(true)
    expect(deps.package1).toBe(TEST_VERSION)
    expect(deps.package2).toBe('2.0.0')
    expect(deps.package3).toBe(TEST_VERSION)
  })

  it('should return false if no packages to install are found in the dependencies object', () => {
    const deps = {
      package1: '1.0.0',
      package2: '2.0.0',
      package3: '3.0.0',
    }
    const result = adjustDeps({ deps, packagesToInstall: ['package4', 'package5'], newlyPublishedPackageVersions: {} })

    expect(result).toBe(false)
    expect(deps.package1).toBe('1.0.0')
    expect(deps.package2).toBe('2.0.0')
    expect(deps.package3).toBe('3.0.0')
  })
})

describe('setNpmTagInDeps', () => {
  it(`should update dependencies with ${TEST_VERSION}`, () => {
    const packageJson = {
      dependencies: {
        'package-1': '^1.0.0',
        'react': '^18.0.0',
      },
      devDependencies: {
        'package-2': '^1.0.0',
        'vitest': '^1.0.0',
      },
      peerDependencies: {
        'package-1': '^1.0.0',
        'react': '^18.0.0',
      },
    }
    const { updatedPkgJson, changed } = setNpmTagInDeps({ packageJson, packagesToInstall: ['package-1', 'package-2'], newlyPublishedPackageVersions: { 'package-1': TEST_VERSION, 'package-2': TEST_VERSION } })

    expect(updatedPkgJson.dependencies).toEqual({
      'package-1': TEST_VERSION,
      'react': '^18.0.0',
    })
    expect(updatedPkgJson.devDependencies).toEqual({
      'package-2': TEST_VERSION,
      'vitest': '^1.0.0',
    })
    expect(updatedPkgJson.peerDependencies).toEqual({
      'package-1': TEST_VERSION,
      'react': '^18.0.0',
    })

    expect(changed).toBe(true)
  })

  it('should not update unrelated dependencies', () => {
    const packageJson = {
      dependencies: {
        'package-1': '^1.0.0',
        'react': '^18.0.0',
      },
      devDependencies: {
        'package-2': '^1.0.0',
      },
      peerDependencies: {
        'package-1': '^1.0.0',
        'react': '^18.0.0',
      },
    }
    const { updatedPkgJson, changed } = setNpmTagInDeps({ packageJson, packagesToInstall: ['package-1'], newlyPublishedPackageVersions: { 'package-1': TEST_VERSION } })

    expect(updatedPkgJson.dependencies).toEqual({
      'package-1': TEST_VERSION,
      'react': '^18.0.0',
    })
    expect(updatedPkgJson.devDependencies).toEqual({
      'package-2': '^1.0.0',
    })
    expect(updatedPkgJson.peerDependencies).toEqual({
      'package-1': TEST_VERSION,
      'react': '^18.0.0',
    })

    expect(changed).toBe(true)
  })

  it('should not change pkgJson if no packages to install are found', () => {
    const packageJson = {
      dependencies: {
        react: '^18.0.0',
      },
      devDependencies: {
        'package-2': '^1.0.0',
      },
      peerDependencies: {
        react: '^18.0.0',
      },
    }
    const { updatedPkgJson, changed } = setNpmTagInDeps({ packageJson, packagesToInstall: ['package-1'], newlyPublishedPackageVersions: { 'package-1': TEST_VERSION } })

    expect(updatedPkgJson.dependencies).toEqual({
      react: '^18.0.0',
    })
    expect(updatedPkgJson.devDependencies).toEqual({
      'package-2': '^1.0.0',
    })
    expect(updatedPkgJson.peerDependencies).toEqual({
      react: '^18.0.0',
    })

    expect(changed).toBe(false)
  })
})
