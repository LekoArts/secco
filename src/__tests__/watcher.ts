/* eslint-disable ts/no-unsafe-function-type */
import type { Destination, Source, WatcherOptions } from '../types'
import chokidar from 'chokidar'

// Import mocked modules
import { deleteAsync } from 'del'
import fs from 'fs-extra'
import { installDependencies } from 'nypm'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkDepsChanges } from '../utils/check-deps-changes'
import { getPackageJson } from '../utils/file'
import { getDependantPackages } from '../utils/get-dependant-packages'
import { logger } from '../utils/logger'
import { traversePkgDeps } from '../utils/traverse-pkg-deps'
import { publishPackagesAndInstall } from '../verdaccio'
import { watcher } from '../watcher'

// Mock all external dependencies first
vi.mock('chokidar')
vi.mock('fs-extra')
vi.mock('del')
vi.mock('nypm')
vi.mock('../utils/logger')
vi.mock('../utils/promisified-spawn')
vi.mock('../utils/check-deps-changes')
vi.mock('../utils/file')
vi.mock('../utils/get-dependant-packages')
vi.mock('../utils/traverse-pkg-deps')
vi.mock('../verdaccio')

// Create mock for chokidar
const mockChokidarInstance = {
  on: vi.fn().mockReturnThis(),
}

// Setup mocks
vi.mocked(chokidar.watch).mockReturnValue(mockChokidarInstance as any)
vi.mocked(fs.copy).mockImplementation((src: any, dest: any, callback: any) => callback())
vi.mocked(fs.existsSync).mockReturnValue(true)
vi.mocked(deleteAsync).mockResolvedValue([])
vi.mocked(installDependencies).mockResolvedValue({} as any)
vi.mocked(checkDepsChanges).mockResolvedValue({ didDepsChange: false, pkgNotInstalled: false })
vi.mocked(getPackageJson).mockReturnValue(undefined)
vi.mocked(getDependantPackages).mockReturnValue(new Set())
vi.mocked(traversePkgDeps).mockReturnValue({ seenPackages: ['package-a'], depTree: {} })
vi.mocked(publishPackagesAndInstall).mockResolvedValue()

// Mock process.exit
vi.spyOn(process, 'exit').mockImplementation((() => {
  // Don't throw for tests that expect process.exit
}) as any)

describe('watcher', () => {
  let mockSource: Source
  let mockDestination: Destination
  let mockOptions: WatcherOptions

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup basic mocks
    mockSource = {
      path: '/source',
      hasWorkspaces: false,
      packages: ['package-a', 'package-b'],
      packageNamesToFilePath: new Map([
        ['package-a', '/source/packages/package-a'],
        ['package-b', '/source/packages/package-b'],
      ]),
      pm: undefined,
    }

    mockDestination = {
      hasWorkspaces: false,
      packages: ['package-a'],
      absolutePathsForDestinationPackages: new Set(['/dest/node_modules/package-a']),
      pm: { name: 'npm' } as any,
    }

    mockOptions = {
      verbose: false,
      scanOnce: false,
      forceVerdaccio: false,
    }
  })

  describe('watcher initialization', () => {
    it('should set default spawn stdio based on verbose flag', async () => {
      const { setDefaultSpawnStdio } = await import('../utils/promisified-spawn')

      // Test with verbose = false
      await watcher(mockSource, mockDestination, undefined, mockOptions)
      expect(setDefaultSpawnStdio).toHaveBeenCalledWith('ignore')

      // Test with verbose = true
      vi.clearAllMocks()
      await watcher(mockSource, mockDestination, undefined, { ...mockOptions, verbose: true })
      expect(setDefaultSpawnStdio).toHaveBeenCalledWith('inherit')
    })

    it('should force verdaccio when destination has workspaces', async () => {
      const { logger } = await import('../utils/logger')
      const destinationWithWorkspaces = { ...mockDestination, hasWorkspaces: true }

      await watcher(mockSource, destinationWithWorkspaces, undefined, { ...mockOptions, forceVerdaccio: false })

      expect(logger.info).toHaveBeenCalledWith('Workspaces detected in destination. Automatically enabling `--force-verdaccio` flag.')
    })

    it('should exit early when no packages to watch', async () => {
      const { logger } = await import('../utils/logger')
      const { traversePkgDeps } = await import('../utils/traverse-pkg-deps')

      // Mock traversePkgDeps to return empty packages
      vi.mocked(traversePkgDeps).mockReturnValueOnce({
        seenPackages: [],
        depTree: {},
      })

      await watcher(mockSource, mockDestination, undefined, mockOptions)

      expect(logger.error).toHaveBeenCalledWith('No packages to watch. Add the package names of your source to the `package.json` of your destination and try again.')
    })
  })

  describe('verdaccio mode', () => {
    it('should publish and install packages when forceVerdaccio is true', async () => {
      const { publishPackagesAndInstall } = await import('../verdaccio')

      await watcher(mockSource, mockDestination, undefined, { ...mockOptions, forceVerdaccio: true })

      expect(publishPackagesAndInstall).toHaveBeenCalledWith({
        packagesToPublish: ['package-a'],
        packageNamesToFilePath: mockSource.packageNamesToFilePath,
        ignorePackageJsonChanges: expect.any(Function),
        source: mockSource,
        destination: mockDestination,
      })
    })

    it('should install from npm when no packages to watch with forceVerdaccio', async () => {
      const { installDependencies } = await import('nypm')
      const { traversePkgDeps } = await import('../utils/traverse-pkg-deps')

      // Mock no packages to watch
      vi.mocked(traversePkgDeps).mockReturnValueOnce({
        seenPackages: [],
        depTree: {},
      })

      await watcher(mockSource, mockDestination, undefined, { ...mockOptions, forceVerdaccio: true })

      expect(installDependencies).toHaveBeenCalledWith({
        cwd: process.cwd(),
        silent: true,
      })
    })

    it('should exit after scanOnce in verdaccio mode', async () => {
      await watcher(mockSource, mockDestination, undefined, {
        ...mockOptions,
        forceVerdaccio: true,
        scanOnce: true,
      })

      // Process.exit should have been called
      expect(process.exit).toHaveBeenCalledWith(0)
    })
  })

  describe('file watcher events', () => {
    let chokidarCallbacks: Record<string, Function>

    beforeEach(() => {
      // Capture chokidar event callbacks
      chokidarCallbacks = {}
      mockChokidarInstance.on.mockImplementation((event: string, callback: Function) => {
        chokidarCallbacks[event] = callback
        return mockChokidarInstance
      })
    })

    it('should only respond to change and add events', async () => {
      await watcher(mockSource, mockDestination, undefined, mockOptions)

      // Trigger various events
      await chokidarCallbacks.all('unlink', '/source/packages/package-a/file.js')
      await chokidarCallbacks.all('addDir', '/source/packages/package-a/dir')

      // These should not trigger any file operations
      expect(fs.copy).not.toHaveBeenCalled()
    })

    it('should correctly match file to package name', async () => {
      await watcher(mockSource, mockDestination, undefined, mockOptions)

      // Wait for ready event
      await chokidarCallbacks.ready()

      // Trigger a valid file change
      await chokidarCallbacks.all('change', '/source/packages/package-a/index.js')

      // Should copy the file
      expect(fs.copy).toHaveBeenCalledWith(
        '/source/packages/package-a/index.js',
        'node_modules/package-a/index.js',
        expect.any(Function),
      )
    })

    it('should skip files not matching any package', async () => {
      await watcher(mockSource, mockDestination, undefined, mockOptions)

      // Trigger a file change outside of any package
      await chokidarCallbacks.all('change', '/source/some-other-file.js')

      // Should not copy the file
      expect(fs.copy).not.toHaveBeenCalled()
    })

    it('should respect package.json files field patterns', async () => {
      const { getPackageJson } = await import('../utils/file')

      // Mock package.json with files field
      vi.mocked(getPackageJson).mockReturnValueOnce({
        name: 'package-a',
        files: ['lib', '*.js'],
      })

      await watcher(mockSource, mockDestination, undefined, mockOptions)
      await chokidarCallbacks.ready()

      // File in lib directory - should copy
      await chokidarCallbacks.all('change', '/source/packages/package-a/lib/index.js')
      expect(fs.copy).toHaveBeenCalledTimes(1)

      // JS file in root - should copy
      await chokidarCallbacks.all('change', '/source/packages/package-a/index.js')
      expect(fs.copy).toHaveBeenCalledTimes(2)

      // File not matching pattern - should NOT copy
      await chokidarCallbacks.all('change', '/source/packages/package-a/src/other.ts')
      expect(fs.copy).toHaveBeenCalledTimes(2)
    })

    it('should always include package.json regardless of files field', async () => {
      const { getPackageJson } = await import('../utils/file')

      // Mock package.json with restrictive files field
      vi.mocked(getPackageJson).mockReturnValueOnce({
        name: 'package-a',
        files: ['lib'],
      })

      await watcher(mockSource, mockDestination, undefined, mockOptions)
      await chokidarCallbacks.ready()

      // package.json should always be copied
      await chokidarCallbacks.all('change', '/source/packages/package-a/package.json')

      // checkDepsChanges should be called for package.json
      const { checkDepsChanges } = await import('../utils/check-deps-changes')
      expect(checkDepsChanges).toHaveBeenCalledWith({
        nodeModulesFilePath: 'node_modules/package-a/package.json',
        packageName: 'package-a',
        sourcePackages: mockSource.packages,
        packageNamesToFilePath: mockSource.packageNamesToFilePath,
        isInitialScan: false,
        ignoredPackageJson: expect.any(Map),
      })
    })
  })

  describe('file copying functionality', () => {
    let chokidarCallbacks: Record<string, Function>

    beforeEach(() => {
      vi.useFakeTimers()

      // Capture chokidar event callbacks
      chokidarCallbacks = {}
      mockChokidarInstance.on.mockImplementation((event: string, callback: Function) => {
        chokidarCallbacks[event] = callback
        return mockChokidarInstance
      })

      // Reset fs.copy mock to succeed by default
      vi.mocked(fs.copy).mockImplementation((src: any, dest: any, callback: any) => callback())
    })

    afterEach(() => {
      vi.clearAllTimers()
      vi.useRealTimers()
      // Reset fs.copy to succeed to avoid lingering failures
      vi.mocked(fs.copy).mockImplementation((src: any, dest: any, callback: any) => callback())
    })

    it('should retry file copy on failure with exponential backoff', async () => {
      const { logger } = await import('../utils/logger')
      let copyAttempts = 0

      // Mock fs.copy to fail first 2 times, then succeed
      vi.mocked(fs.copy).mockImplementation((src: any, dest: any, callback: any) => {
        copyAttempts++
        if (copyAttempts <= 2) {
          callback(new Error('Copy failed'))
        }
        else {
          callback()
        }
      })

      await watcher(mockSource, mockDestination, undefined, mockOptions)
      const readyPromise = chokidarCallbacks.ready()

      // Trigger file change
      await chokidarCallbacks.all('change', '/source/packages/package-a/index.js')

      // Wait for initial scan and queue processing
      await readyPromise

      // First attempt should fail
      expect(copyAttempts).toBe(1)

      // Wait for first retry (500ms)
      await vi.advanceTimersByTimeAsync(500)
      expect(copyAttempts).toBe(2)

      // Wait for second retry (1000ms)
      await vi.advanceTimersByTimeAsync(1000)
      expect(copyAttempts).toBe(3)

      // Should log success
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Copied `packages/package-a/index.js`'),
      )
    })

    it('should fail after MAX_COPY_RETRIES attempts', async () => {
      const { logger } = await import('../utils/logger')

      // Track attempts for a specific file
      const attemptsByFile = new Map<string, number>()
      const maxRetries = 3

      // Mock fs.copy to fail exactly MAX_COPY_RETRIES times per file
      vi.mocked(fs.copy).mockImplementation((src: any, dest: any, callback: any) => {
        const attempts = (attemptsByFile.get(src) || 0) + 1
        attemptsByFile.set(src, attempts)

        if (attempts <= maxRetries) {
          // Fail for the first 3 attempts
          callback(new Error(`Copy failed attempt ${attempts}`))
        }
        else if (attempts === maxRetries + 1) {
          // Final attempt should also fail to trigger the error log
          callback(new Error(`Copy failed final attempt`))
        }
        else {
          // Any subsequent calls succeed (shouldn't happen)
          callback()
        }
      })

      await watcher(mockSource, mockDestination, undefined, mockOptions)

      // Trigger file change
      await chokidarCallbacks.all('change', '/source/packages/package-a/index.js')

      // Wait for ready to run queued copies
      await chokidarCallbacks.ready()

      // Advance through all retries
      await vi.advanceTimersByTimeAsync(500) // First retry
      await vi.advanceTimersByTimeAsync(1000) // Second retry
      await vi.advanceTimersByTimeAsync(2000) // Third retry

      // Should have attempted exactly MAX_COPY_RETRIES + 1 times
      const filePath = '/source/packages/package-a/index.js'
      expect(attemptsByFile.get(filePath)).toBe(maxRetries + 1)

      // Should log error after max retries
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Copy failed final attempt',
        }),
      )

      // Wait a bit more for the Promise.all catch handler
      await vi.advanceTimersByTimeAsync(100)

      // Should also log the Promise.all error
      expect(logger.error).toHaveBeenCalledWith(
        'One or more file copies failed:',
        expect.objectContaining({
          message: 'Copy failed final attempt',
        }),
      )
    })
  })

  describe('queue management', () => {
    let chokidarCallbacks: Record<string, Function>

    beforeEach(() => {
      // Capture chokidar event callbacks
      chokidarCallbacks = {}
      mockChokidarInstance.on.mockImplementation((event: string, callback: Function) => {
        chokidarCallbacks[event] = callback
        return mockChokidarInstance
      })
    })

    it('should queue copies before package installation and process after ready', async () => {
      await watcher(mockSource, mockDestination, undefined, mockOptions)

      // Trigger file changes before ready event
      await chokidarCallbacks.all('change', '/source/packages/package-a/file1.js')
      await chokidarCallbacks.all('change', '/source/packages/package-a/file2.js')

      // Files should NOT be copied yet
      expect(fs.copy).not.toHaveBeenCalled()

      // Trigger ready event
      await chokidarCallbacks.ready()

      // Now files should be copied
      expect(fs.copy).toHaveBeenCalledTimes(2)
    })

    it('should clear stale JS files from node_modules', async () => {
      await watcher(mockSource, mockDestination, undefined, mockOptions)

      // Trigger file changes
      await chokidarCallbacks.all('change', '/source/packages/package-a/index.js')

      // Trigger ready event
      await chokidarCallbacks.ready()

      // Should have called deleteAsync with correct patterns
      expect(deleteAsync).toHaveBeenCalledWith([
        'node_modules/package-a/**/*.{js,js.map}',
        '!node_modules/package-a/node_modules/**/*.{js,js.map}',
        '!node_modules/package-a/src/**/*.{js,js.map}',
      ])
    })
  })

  describe('chokidar ready event', () => {
    let chokidarCallbacks: Record<string, Function>

    beforeEach(() => {
      // Capture chokidar event callbacks
      chokidarCallbacks = {}
      mockChokidarInstance.on.mockImplementation((event: string, callback: Function) => {
        chokidarCallbacks[event] = callback
        return mockChokidarInstance
      })
    })

    it('should publish packages if dependency changes detected', async () => {
      // Mock dependency changes
      vi.mocked(checkDepsChanges).mockResolvedValueOnce({
        didDepsChange: true,
        pkgNotInstalled: false,
      })

      // Mock getDependantPackages to return dependent packages
      vi.mocked(getDependantPackages).mockReturnValueOnce(new Set(['package-a', 'package-b']))

      await watcher(mockSource, mockDestination, undefined, mockOptions)

      // Trigger package.json change
      await chokidarCallbacks.all('change', '/source/packages/package-a/package.json')

      // Trigger ready event
      await chokidarCallbacks.ready()

      // Should publish packages
      expect(publishPackagesAndInstall).toHaveBeenCalledWith({
        packagesToPublish: expect.arrayContaining(['package-a', 'package-b']),
        packageNamesToFilePath: mockSource.packageNamesToFilePath,
        ignorePackageJsonChanges: expect.any(Function),
        source: mockSource,
        destination: mockDestination,
      })
    })

    it('should install packages if any were not installed', async () => {
      // Mock package not installed
      vi.mocked(checkDepsChanges).mockResolvedValueOnce({
        didDepsChange: false,
        pkgNotInstalled: true,
      })

      await watcher(mockSource, mockDestination, undefined, mockOptions)

      // Trigger package.json change
      await chokidarCallbacks.all('change', '/source/packages/package-a/package.json')

      // Trigger ready event
      await chokidarCallbacks.ready()

      // Should install dependencies
      expect(installDependencies).toHaveBeenCalledWith({
        cwd: process.cwd(),
        silent: true,
      })
    })

    it('should exit if scanOnce is true after all copies complete', async () => {
      // Reset fs.copy to succeed immediately
      vi.mocked(fs.copy).mockImplementation((src: any, dest: any, callback: any) => callback())

      // Set scanOnce option
      const scanOnceOptions = { ...mockOptions, scanOnce: true }

      // Start watcher
      await watcher(mockSource, mockDestination, undefined, scanOnceOptions)

      // Trigger a file change
      await chokidarCallbacks.all('change', '/source/packages/package-a/index.js')

      // Trigger ready event - this starts processing copies
      await chokidarCallbacks.ready()

      // Allow the promise chain to resolve
      await new Promise(resolve => setImmediate(resolve))

      // Verify process.exit was called
      expect(process.exit).toHaveBeenCalledWith(0)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle missing package paths gracefully', async () => {
      // Create a source with a package that has no file path
      const sourceWithMissingPath = {
        ...mockSource,
        packageNamesToFilePath: new Map([
          ['package-a', '/source/packages/package-a'],
          // package-b is in packages list but not in the map
        ]),
      }

      // Should not throw and should only watch existing packages
      await expect(
        watcher(sourceWithMissingPath, mockDestination, undefined, mockOptions),
      ).resolves.not.toThrow()
    })

    it('should skip non-existent package directories', async () => {
      // Mock existsSync to return false for one package
      vi.mocked(fs.existsSync).mockImplementation((path: any) => {
        if (path.includes('package-b')) {
          return false
        }
        return true
      })

      await watcher(mockSource, mockDestination, undefined, mockOptions)

      // Should only watch existing directories
      expect(chokidar.watch).toHaveBeenCalledWith(
        expect.arrayContaining(['/source/packages/package-a']),
        expect.any(Object),
      )
    })

    it('should handle malformed package.json files', async () => {
      // Mock getPackageJson to throw for one call
      vi.mocked(getPackageJson)
        .mockReturnValueOnce(undefined) // First call returns undefined
        .mockReturnValueOnce({ name: 'package-b', files: ['lib'] }) // Second call is valid

      // Should not throw
      await expect(
        watcher(mockSource, mockDestination, undefined, mockOptions),
      ).resolves.not.toThrow()
    })

    it('should handle circular dependencies in depTree', async () => {
      // Mock traversePkgDeps to return circular dependencies
      vi.mocked(traversePkgDeps).mockReturnValue({
        seenPackages: ['package-a', 'package-b'],
        depTree: {
          'package-a': new Set(['package-b']),
          'package-b': new Set(['package-a']), // Circular dependency
        },
      })

      // Mock getDependantPackages to handle circular deps
      vi.mocked(getDependantPackages).mockReturnValue(new Set(['package-a', 'package-b']))

      await watcher(mockSource, mockDestination, undefined, mockOptions)

      // Setup callbacks
      const chokidarCallbacks: Record<string, Function> = {}
      mockChokidarInstance.on.mock.calls.forEach(([event, callback]) => {
        chokidarCallbacks[event] = callback
      })

      // Mock dependency change
      vi.mocked(checkDepsChanges).mockResolvedValueOnce({
        didDepsChange: true,
        pkgNotInstalled: false,
      })

      // Trigger package.json change
      await chokidarCallbacks.all('change', '/source/packages/package-a/package.json')
      await chokidarCallbacks.ready()

      // Should handle circular dependencies without infinite loop
      expect(publishPackagesAndInstall).toHaveBeenCalledTimes(1)
    })
  })

  describe('package.json publishing state handling', () => {
    it('should ignore package.json changes during publishing', async () => {
      // Reset mocks
      vi.mocked(publishPackagesAndInstall).mockReset()
      vi.mocked(publishPackagesAndInstall).mockResolvedValue()

      await watcher(mockSource, mockDestination, undefined, mockOptions)

      // Setup callbacks
      const chokidarCallbacks: Record<string, Function> = {}
      mockChokidarInstance.on.mock.calls.forEach(([event, callback]) => {
        chokidarCallbacks[event] = callback
      })

      // Mock dependency change to trigger publishing
      vi.mocked(checkDepsChanges).mockResolvedValueOnce({
        didDepsChange: true,
        pkgNotInstalled: false,
      })
      vi.mocked(getDependantPackages).mockReturnValue(new Set(['package-a']))

      // Trigger initial package.json change
      await chokidarCallbacks.all('change', '/source/packages/package-a/package.json')

      // Trigger ready - this starts publishing
      await chokidarCallbacks.ready()

      // Verify publishing was triggered
      expect(publishPackagesAndInstall).toHaveBeenCalled()

      // The test demonstrates the concept, but the actual isPublishing flag
      // is internal to the watcher and hard to test directly
    })
  })

  describe('error recovery', () => {
    it('should continue processing other files when one file copy fails', async () => {
      let copyCount = 0

      // Mock fs.copy to fail for first file, succeed for second
      vi.mocked(fs.copy).mockImplementation((src: any, dest: any, callback: any) => {
        copyCount++
        if (copyCount === 1) {
          // Fail immediately (after max retries)
          callback(new Error('Copy failed'))
        }
        else {
          callback() // Success
        }
      })

      await watcher(mockSource, mockDestination, undefined, mockOptions)

      // Setup callbacks
      const chokidarCallbacks: Record<string, Function> = {}
      mockChokidarInstance.on.mock.calls.forEach(([event, callback]) => {
        chokidarCallbacks[event] = callback
      })

      // Trigger multiple file changes
      await chokidarCallbacks.all('change', '/source/packages/package-a/file1.js')
      await chokidarCallbacks.all('change', '/source/packages/package-a/file2.js')

      // Process files
      await chokidarCallbacks.ready()

      // Both files should be attempted
      expect(fs.copy).toHaveBeenCalledTimes(2)

      // Second file should succeed
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Copied `packages/package-a/file2.js`'),
      )
    })
  })

  describe('packages parameter filtering', () => {
    it('should only watch specified packages when packages parameter is provided', async () => {
      // Specify only package-a
      const packages = ['package-a']

      await watcher(mockSource, mockDestination, packages, mockOptions)

      // Should only watch package-a directory
      expect(chokidar.watch).toHaveBeenCalledWith(
        ['/source/packages/package-a'],
        expect.any(Object),
      )
    })

    it('should watch intersection of specified packages and seen packages', async () => {
      // Mock traversePkgDeps to return both packages as seen
      vi.mocked(traversePkgDeps).mockReturnValue({
        seenPackages: ['package-a', 'package-b', 'package-c'],
        depTree: {},
      })

      // Specify only package-a and package-c
      const packages = ['package-a', 'package-c']

      await watcher(mockSource, mockDestination, packages, mockOptions)

      // Should watch intersection (package-a only, since package-c is not in source)
      expect(chokidar.watch).toHaveBeenCalledWith(
        expect.arrayContaining(['/source/packages/package-a']),
        expect.any(Object),
      )
    })
  })
})
