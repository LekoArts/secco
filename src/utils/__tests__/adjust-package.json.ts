import type { Source } from '../../types'
import destr from 'destr'
import fs from 'fs-extra'
import { vi } from 'vitest'
import { CLI_NAME } from '../../constants'
import { registerCleanupTask } from '../../verdaccio/cleanup-tasks'
import { adjustPackageJson } from '../adjust-package-json'

vi.mock('fs-extra')
vi.mock('destr')
vi.mock('../../verdaccio/cleanup-tasks', { spy: true })
vi.mock('../file', async () => {
  const actual = await vi.importActual<typeof import('../file')>('../file')
  return {
    ...actual,
    getSourcePackageJsonPath: vi.fn().mockReturnValue('/path/to/test-package/package.json'),
  }
})
vi.mock('../pnpm', async () => {
  const actual = await vi.importActual<typeof import('../pnpm')>('../pnpm')
  return {
    ...actual,
    readWorkspaceManifest: vi.fn().mockReturnValue({
      packages: ['packages/*'],
      catalogs: {
        default: {
          'catalog-dep': '1.0.0',
        },
        react: {
          'react-catalog-dep': '2.0.0',
        },
      },
    }),
  }
})

const source = {
  pm: {
    name: 'pnpm',
    command: 'pnpm',
  },
  hasWorkspaces: true,
  path: '/path/to/source',
  packages: [],
  packageNamesToFilePath: new Map(),
} satisfies Source

const sourcePkgJsonPath = '/path/to/source/package.json'
const packageName = 'test-package'
const packageNamesToFilePath = new Map(Object.entries({ 'test-package': '/path/to/test-package/package.json' }))
const packagesToPublish = ['test-package']
const versionPostfix = 'test'
const sourcePkgJson = { version: '1.0.0', dependencies: { 'test-package': '^1.0.0', 'workspace-dep': 'workspace:*', 'catalog-dep': 'catalog:', 'react-catalog-dep': 'catalog:react' } }
const testPkgJson = { version: '1.0.0' }
const sourcePkgJsonString = JSON.stringify(sourcePkgJson)
const testPkgJsonString = JSON.stringify(testPkgJson)
const tempSourcePkgJsonString = JSON.stringify({ version: `1.0.0-${CLI_NAME}-${versionPostfix}`, dependencies: { 'test-package': `1.0.0-${CLI_NAME}-${versionPostfix}`, 'workspace-dep': 'latest', 'catalog-dep': '1.0.0', 'react-catalog-dep': '2.0.0' } })

const ignorePackageJsonChanges = vi.fn()
const revertIgnorePackageJsonChanges = vi.fn()

describe('adjustPackageJson', () => {
  let result: ReturnType<typeof adjustPackageJson>

  beforeAll(() => {
    vi.mocked(fs.readFileSync).mockReturnValueOnce(sourcePkgJsonString).mockReturnValueOnce(testPkgJsonString)
    vi.mocked(destr).mockReturnValueOnce(sourcePkgJson).mockReturnValueOnce(testPkgJson)
    ignorePackageJsonChanges.mockReturnValue(revertIgnorePackageJsonChanges)

    result = adjustPackageJson({
      sourcePkgJsonPath,
      packageName,
      packageNamesToFilePath,
      packagesToPublish,
      ignorePackageJsonChanges,
      versionPostfix,
      source,
    })
  })

  afterAll(() => {
    vi.resetAllMocks()
  })

  it('should change version', () => {
    expect(sourcePkgJson.version).toBe(`1.0.0-${CLI_NAME}-${versionPostfix}`)
    expect(result.newPackageVersion).toBe(`1.0.0-${CLI_NAME}-${versionPostfix}`)
  })
  it('should adjust dependencies', () => {
    expect(fs.readFileSync).toHaveBeenCalledWith(sourcePkgJsonPath, 'utf-8')
    expect(destr).toHaveBeenCalledWith(sourcePkgJsonString)
    expect(sourcePkgJson.version).toBe(`1.0.0-${CLI_NAME}-${versionPostfix}`)
    expect(sourcePkgJson.dependencies?.['test-package']).toBe(`1.0.0-${CLI_NAME}-${versionPostfix}`)
    expect(fs.outputFileSync).toHaveBeenCalledWith(sourcePkgJsonPath, tempSourcePkgJsonString)
    expect(result.newPackageVersion).toBe(`1.0.0-${CLI_NAME}-${versionPostfix}`)
    expect(registerCleanupTask).toHaveBeenCalled()
  })
  it('should revert changes on cleanup', () => {
    result.revertAdjustPackageJson()

    expect(fs.outputFileSync).toHaveBeenCalledWith(sourcePkgJsonPath, sourcePkgJsonString)
    expect(revertIgnorePackageJsonChanges).toHaveBeenCalled()
  })
})
