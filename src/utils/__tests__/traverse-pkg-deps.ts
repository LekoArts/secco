import { join } from 'pathe'
import { traversePkgDeps } from '../traverse-pkg-deps'

const FIXTURE_PATH = join(__dirname, 'fixtures', 'dependency-chains')

describe('traversePkgDeps', () => {
  it('handles deep dependency chains', () => {
    const sourcePackages = [
      'package-a',
      'package-a-dep1',
      'package-a-dep1-dep1',
      'package-not-used',
    ]
    const packageNamesToFilePath = new Map()
    for (const packageName of sourcePackages) {
      packageNamesToFilePath.set(
        packageName,
        join(FIXTURE_PATH, packageName),
      )
    }

    const { seenPackages, depTree } = traversePkgDeps({
      packages: ['package-a', 'doesnt-exist'],
      sourcePackages,
      packageNamesToFilePath,
    })

    expect(seenPackages).toEqual([
      'package-a',
      'package-a-dep1',
      'package-a-dep1-dep1',
    ])

    expect(depTree).toEqual({
      'package-a-dep1': new Set(['package-a']),
      'package-a-dep1-dep1': new Set(['package-a-dep1']),
    })
  })
})
