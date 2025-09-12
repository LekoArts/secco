import type { PackageJson } from '../../types'
import type { CheckDependencyChangesArgs } from '../check-deps-changes'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NPM_DIST_TAG } from '../../constants'
import { checkDepsChanges, difference } from '../check-deps-changes'

// Mock dependencies
vi.mock('fs-extra')
vi.mock('node-fetch')
vi.mock('../logger')
vi.mock('../file')

const mockFs = vi.hoisted(() => ({
  readFile: vi.fn(),
}))

const mockFetch = vi.hoisted(() => vi.fn())

const mockLogger = vi.hoisted(() => ({
  logger: {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

const mockFile = vi.hoisted(() => ({
  getPackageVersion: vi.fn(),
  getSourcePackageJsonPath: vi.fn(),
}))

vi.mock('fs-extra', () => ({ default: mockFs }))
vi.mock('node-fetch', () => ({ default: mockFetch }))
vi.mock('../logger', () => mockLogger)
vi.mock('../file', () => mockFile)

describe('difference', () => {
  it('should return the diff between two objects', () => {
    const result = difference(
      { a: 1, b: 2, c: 3 },
      { a: 1, b: 2, c: 4 },
    )

    expect(result).toEqual({ c: 3 })
  })
  it('should return the diff between two objects with nested objects', () => {
    const result = difference(
      { a: 1, b: 2, c: { d: 3, e: 4 } },
      { a: 1, b: 2, c: { d: 3, e: 5 } },
    )

    expect(result).toEqual({ c: { e: 4 } })
  })
})

describe('checkDepsChanges', () => {
  let defaultArgs: CheckDependencyChangesArgs

  beforeEach(() => {
    vi.resetAllMocks()

    defaultArgs = {
      nodeModulesFilePath: '/path/to/node_modules/test-package/package.json',
      packageName: 'test-package',
      sourcePackages: ['source-package-1', 'source-package-2'],
      ignoredPackageJson: new Map(),
      packageNamesToFilePath: new Map([['test-package', '/source/test-package/package.json']]),
      isInitialScan: true,
    }

    mockFile.getSourcePackageJsonPath.mockReturnValue('/source/test-package/package.json')
  })

  describe('package not installed', () => {
    it('should fetch from unpkg during initial scan', async () => {
      const unpkgPackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
        },
      }

      const sourcePackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
        },
      }

      // Package not found in node_modules
      mockFs.readFile.mockRejectedValueOnce(new Error('File not found'))
      // Source package.json exists
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(sourcePackageJson))

      // Mock unpkg fetch
      mockFile.getPackageVersion.mockReturnValue('1.0.0')
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => unpkgPackageJson,
      })

      const result = await checkDepsChanges(defaultArgs)

      expect(result).toEqual({
        didDepsChange: false,
        pkgNotInstalled: true,
      })
      expect(mockFetch).toHaveBeenCalledWith('https://unpkg.com/test-package@1.0.0/package.json')
    })

    it('should return early when package is not installed after initial scan', async () => {
      const sourcePackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
        },
      }

      // Package not found in node_modules
      mockFs.readFile.mockRejectedValueOnce(new Error('File not found'))
      // Source package.json exists
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(sourcePackageJson))

      const result = await checkDepsChanges({
        ...defaultArgs,
        isInitialScan: false,
      })

      expect(result).toEqual({
        didDepsChange: false,
        pkgNotInstalled: true,
      })
      expect(mockLogger.logger.info).toHaveBeenCalledWith(
        '`test-package` does not seem to be installed. Restart secco to publish it.',
      )
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle unpkg fetch failure', async () => {
      const sourcePackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
        },
      }

      // Setup mocks in order of execution
      mockFs.readFile
        .mockRejectedValueOnce(new Error('File not found')) // node_modules read fails
        .mockResolvedValueOnce(JSON.stringify(sourcePackageJson)) // source package.json read

      // Mock unpkg fetch failure
      mockFile.getPackageVersion.mockReturnValue('1.0.0')
      mockFetch.mockResolvedValueOnce({
        status: 404,
      })

      const result = await checkDepsChanges(defaultArgs)

      expect(result).toEqual({
        didDepsChange: true,
        pkgNotInstalled: true,
      })
      expect(mockLogger.logger.warn).toHaveBeenCalled()
    })
  })

  describe('package installed', () => {
    it('should return false when dependencies are equal', async () => {
      const nodeModulesPackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
        },
      }

      const sourcePackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
        },
      }

      // Setup mocks - ensure clean slate
      mockFs.readFile.mockReset()
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(nodeModulesPackageJson))
        .mockResolvedValueOnce(JSON.stringify(sourcePackageJson))

      const result = await checkDepsChanges(defaultArgs)

      expect(result).toEqual({
        didDepsChange: false,
        pkgNotInstalled: false,
      })
      expect(mockLogger.logger.log).not.toHaveBeenCalled()
    })

    it('should detect version changes for third-party packages', async () => {
      const nodeModulesPackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.20',
          react: '18.0.0',
        },
      }

      const sourcePackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
          react: '18.0.0',
        },
      }

      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(nodeModulesPackageJson))
        .mockResolvedValueOnce(JSON.stringify(sourcePackageJson))

      const result = await checkDepsChanges(defaultArgs)

      expect(result).toEqual({
        didDepsChange: true,
        pkgNotInstalled: false,
      })
      expect(mockLogger.logger.log).toHaveBeenCalledWith(
        expect.stringContaining('`lodash` changed version from 4.17.20 to 4.17.21'),
      )
    })

    it('should detect added dependencies', async () => {
      const nodeModulesPackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
        },
      }

      const sourcePackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
          react: '18.0.0',
        },
      }

      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(nodeModulesPackageJson))
        .mockResolvedValueOnce(JSON.stringify(sourcePackageJson))

      const result = await checkDepsChanges(defaultArgs)

      expect(result).toEqual({
        didDepsChange: true,
        pkgNotInstalled: false,
      })
      expect(mockLogger.logger.log).toHaveBeenCalledWith(
        expect.stringContaining('`react@18.0.0` was added'),
      )
    })

    it('should detect removed dependencies', async () => {
      const nodeModulesPackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
          react: '18.0.0',
        },
      }

      const sourcePackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
        },
      }

      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(nodeModulesPackageJson))
        .mockResolvedValueOnce(JSON.stringify(sourcePackageJson))

      const result = await checkDepsChanges(defaultArgs)

      expect(result).toEqual({
        didDepsChange: false, // Removals don't need publishing
        pkgNotInstalled: false,
      })
      expect(mockLogger.logger.log).toHaveBeenCalledWith(
        expect.stringContaining('`react@18.0.0` was removed'),
      )
    })
  })

  describe('special dependency handling', () => {
    it('should ignore workspace: protocol dependencies', async () => {
      const nodeModulesPackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'my-lib': '1.0.0',
        },
      }

      const sourcePackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'my-lib': 'workspace:*',
        },
      }

      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(nodeModulesPackageJson))
        .mockResolvedValueOnce(JSON.stringify(sourcePackageJson))

      const result = await checkDepsChanges(defaultArgs)

      expect(result).toEqual({
        didDepsChange: false,
        pkgNotInstalled: false,
      })
      expect(mockLogger.logger.log).not.toHaveBeenCalled()
    })

    it('should ignore catalog: protocol dependencies', async () => {
      const nodeModulesPackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'my-lib': '1.0.0',
        },
      }

      const sourcePackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'my-lib': 'catalog:react',
        },
      }

      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(nodeModulesPackageJson))
        .mockResolvedValueOnce(JSON.stringify(sourcePackageJson))

      const result = await checkDepsChanges(defaultArgs)

      expect(result).toEqual({
        didDepsChange: false,
        pkgNotInstalled: false,
      })
    })

    it(`should ignore NPM_DIST_TAG (${NPM_DIST_TAG}) dependencies`, async () => {
      const nodeModulesPackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'my-lib': NPM_DIST_TAG,
          'other-lib': '2.0.0',
        },
      }

      const sourcePackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'my-lib': '1.0.0',
          'other-lib': NPM_DIST_TAG,
        },
      }

      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(nodeModulesPackageJson))
        .mockResolvedValueOnce(JSON.stringify(sourcePackageJson))

      const result = await checkDepsChanges(defaultArgs)

      expect(result).toEqual({
        didDepsChange: false,
        pkgNotInstalled: false,
      })
    })

    it('should ignore version changes for source packages', async () => {
      const nodeModulesPackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'source-package-1': '1.0.0',
          'lodash': '4.17.20',
        },
      }

      const sourcePackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'source-package-1': '2.0.0', // This change should be ignored
          'lodash': '4.17.21', // This change should be detected
        },
      }

      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(nodeModulesPackageJson))
        .mockResolvedValueOnce(JSON.stringify(sourcePackageJson))

      const result = await checkDepsChanges(defaultArgs)

      expect(result).toEqual({
        didDepsChange: true,
        pkgNotInstalled: false,
      })
      expect(mockLogger.logger.log).toHaveBeenCalledWith(
        expect.stringContaining('`lodash` changed version from 4.17.20 to 4.17.21'),
      )
      expect(mockLogger.logger.log).not.toHaveBeenCalledWith(
        expect.stringContaining('source-package-1'),
      )
    })
  })

  describe('edge cases', () => {
    it('should handle missing dependencies field', async () => {
      const nodeModulesPackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        // No dependencies field
      }

      const sourcePackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        // No dependencies field
      }

      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(nodeModulesPackageJson))
        .mockResolvedValueOnce(JSON.stringify(sourcePackageJson))

      const result = await checkDepsChanges(defaultArgs)

      expect(result).toEqual({
        didDepsChange: false,
        pkgNotInstalled: false,
      })
    })

    it('should handle ignored package.json', async () => {
      const packageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
        },
      }
      const packageJsonString = JSON.stringify(packageJson)

      mockFs.readFile.mockResolvedValue(packageJsonString)

      const ignoredPackageJson = new Map([
        ['test-package', [packageJsonString]],
      ])

      const result = await checkDepsChanges({
        ...defaultArgs,
        ignoredPackageJson,
      })

      expect(result).toEqual({
        didDepsChange: false,
        pkgNotInstalled: false,
      })
    })

    it('should return early when source package is not found', async () => {
      // Mock node_modules package.json read
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify({
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
        },
      }))

      mockFile.getSourcePackageJsonPath.mockReturnValue(null)

      const result = await checkDepsChanges(defaultArgs)

      expect(result).toEqual({
        didDepsChange: false,
        pkgNotInstalled: false,
      })
      expect(mockFs.readFile).toHaveBeenCalledTimes(1) // Only tried to read node_modules
    })
  })
})
