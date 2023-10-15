import { join } from 'pathe'
import { vi } from 'vitest'
import { traversePkgDeps } from '../traverse-pkg-deps'

function mockReadJsonSync(path: string) {
  if (path === join(...'<root>/packages/package-a/package.json'.split('/'))) {
    return {
      dependencies: {
        'unrelated-package': '*',
        'package-a-dep1': '*',
      },
    }
  }

  if (path === join(
    ...'<root>/packages/package-a-dep1/package.json'.split('/'),
  )) {
    return {
      dependencies: {
        'package-a-dep1-dep1': '*',
      },
    }
  }

  if (path === join(
    ...'<root>/packages/package-a-dep1-dep1/package.json'.split('/'),
  )) {
    return {
      dependencies: {},
    }
  }
}

vi.mock('fs-extra/esm', async () => {
  const actual = await vi.importActual('fs-extra/esm') as any
  return {
    ...actual,
    readJsonSync: vi.fn((path) => {
      return mockReadJsonSync(path)
    }),
  }
})

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
        join(...`<root>/packages/${packageName}`.split('/')),
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
