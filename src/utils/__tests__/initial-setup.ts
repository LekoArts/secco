import type { Mock } from 'vitest'
import process from 'node:process'
import fs from 'fs-extra'
import { vi } from 'vitest'
import { checkDirHasPackageJson, getAbsolutePathsForDestinationPackages, getDestinationPackages, getPackageNamesToFilePath, getPackages, isPrivate } from '../initial-setup'
import { logger } from '../logger'

describe('getDestinationPackages', () => {
  describe('single package', () => {
    it('returns an empty array if destination package.json is missing', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(undefined as any)

      const result = getDestinationPackages(['package1', 'package2'], null)

      expect(result).toEqual([])
    })

    it('returns an empty array if sourcePackages is empty', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{}')

      const result = getDestinationPackages([], null)

      expect(result).toEqual([])
    })

    it('returns an empty array if there are no matching dependencies', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{"dependencies": {"package3": "^1.0.0"}}')

      const result = getDestinationPackages(['package1', 'package2'], null)

      expect(result).toEqual([])
    })

    it('returns an array of matching dependencies', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{"dependencies": {"package1": "^1.0.0", "package3": "^1.0.0"}}')

      const result = getDestinationPackages(['package1', 'package2'], null)

      expect(result).toEqual(['package1'])
    })

    it('returns an array of matching devDependencies', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{"devDependencies": {"package2": "^1.0.0", "package3": "^1.0.0"}}')

      const result = getDestinationPackages(['package1', 'package2'], null)

      expect(result).toEqual(['package2'])
    })

    it('returns an array of matching dependencies and devDependencies', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{"dependencies": {"package1": "^1.0.0", "package3": "^1.0.0"}, "devDependencies": {"package2": "^1.0.0"}}')

      const result = getDestinationPackages(['package1', 'package2'], null)

      expect(result).toEqual(['package1', 'package2'])
    })

    it('sets the pkg name + path in destinationPackageNameToFilePath Map if intersection', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{"name": "package2", "dependencies": {"package1": "^1.0.0"}}')

      getDestinationPackages(['package1'], null)

      expect(getAbsolutePathsForDestinationPackages().has(process.cwd())).toBe(true)
    })
  })
  describe('workspaces', () => {
    it('returns an empty array if no workspaces are found', () => {
      const result = getDestinationPackages(['package1', 'package2'], [])

      expect(result).toEqual([])
    })

    it('returns an empty array if there are no matching dependencies', () => {
      const result = getDestinationPackages(['package1', 'package2'], [{ location: 'location-package3', package: { name: 'package3', dependencies: { package4: '^1.0.0' } } }])

      expect(result).toEqual([])
    })

    it('returns an array of matching dependencies', () => {
      const result = getDestinationPackages(['package1', 'package2'], [{ location: 'location-package3', package: { name: 'package3', dependencies: { package1: '^1.0.0' } } }, { location: 'location-package4', package: { name: 'package4', dependencies: { package2: '^1.0.0' } } }])

      expect(result).toEqual(['package1', 'package2'])
    })

    it('returns an array of matching devDependencies', () => {
      const result = getDestinationPackages(['package1', 'package2'], [{ location: 'location-package3', package: { name: 'package3', devDependencies: { package1: '^1.0.0' } } }, { location: 'location-package4', package: { name: 'package4', devDependencies: { package2: '^1.0.0' } } }])

      expect(result).toEqual(['package1', 'package2'])
    })

    it('sets the pkg name + path in destinationPackageNameToFilePath Map if intersection', () => {
      getDestinationPackages(['package1', 'package2'], [{ location: 'location-package3', package: { name: 'package3', dependencies: { package1: '^1.0.0' } } }, { location: 'location-package4', package: { name: 'package4', devDependencies: { package2: '^1.0.0' } } }])

      expect(getAbsolutePathsForDestinationPackages().has('location-package3')).toBe(true)
      expect(getAbsolutePathsForDestinationPackages().has('location-package4')).toBe(true)
    })
  })
})

describe('getPackages', () => {
  describe('single package', () => {
    beforeEach(() => {
      logger.mockTypes(() => vi.fn())
    })

    it('returns an array with a single entry', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{"name": "package1"}')

      const result = getPackages('sourcePath', null)

      expect(result).toEqual(['package1'])
    })
    it('returns an empty array if no name is found', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{}')

      const result = getPackages('sourcePath', null)

      expect(result).toEqual([])
    })
    it('returns an empty array if the package is private', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{"name": "package1", "private": true}')

      const result = getPackages('sourcePath', null)
      const mockLoggerInfo = ((logger.info as unknown as Mock).mock).calls[0][0]

      expect(result).toEqual([])
      expect(mockLoggerInfo).toContain('Skipping private package')
    })
    it('sets the package name and path in the packageNameToFilePath Map', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{"name": "package1"}')

      getPackages('sourcePath', null)

      expect(getPackageNamesToFilePath().get('package1')).toBe('sourcePath')
    })
  })
  describe('workspaces', () => {
    it('returns an array with multiple entries', () => {
      const result = getPackages('sourcePath', [{ location: 'location-package1', package: { name: 'package1' } }, { location: 'location-package2', package: { name: 'package2' } }])

      expect(result).toEqual(['package1', 'package2'])
    })
    it('returns an empty array if no workspaces are found', () => {
      const result = getPackages('sourcePath', [])

      expect(result).toEqual([])
    })
    it('returns a filter array exlcuding packages that are private', () => {
      const result = getPackages('sourcePath', [{ location: 'location-package1', package: { name: 'package1' } }, { location: 'location-package2', package: { name: 'package2', private: true } }])
      const mockLoggerInfo = ((logger.info as unknown as Mock).mock).calls[0][0]

      expect(result).toEqual(['package1'])
      expect(mockLoggerInfo).toContain('Skipping private package')
    })
    it('sets the package name and path in the packageNameToFilePath Map', () => {
      getPackages('sourcePath', [{ location: 'location-package1', package: { name: 'package1' } }, { location: 'location-package2', package: { name: 'package2' } }])

      expect(getPackageNamesToFilePath().get('package1')).toBe('location-package1')
      expect(getPackageNamesToFilePath().get('package2')).toBe('location-package2')
    })
  })
})

describe('checkDirHasPackageJson', () => {
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

  beforeEach(() => {
    logger.mockTypes(() => vi.fn())
  })

  afterEach(() => {
    mockExit.mockClear()
  })

  afterAll(() => {
    mockExit.mockRestore()
  })

  it('should exit the process if no package.json file is found', () => {
    const mockExistsSync = vi.spyOn(fs, 'existsSync').mockReturnValue(false)

    checkDirHasPackageJson()
    const mockLoggerFatal = ((logger.fatal as unknown as Mock).mock).calls[0][0]

    expect(mockExistsSync).toHaveBeenCalledWith(`${process.cwd()}/package.json`)
    expect(mockLoggerFatal).toContain('No `package.json` found')
    expect(mockExit).toHaveBeenCalledWith()
  })

  it('should not exit the process if a package.json file is found', () => {
    const mockExistsSync = vi.spyOn(fs, 'existsSync').mockReturnValue(true)

    checkDirHasPackageJson()
    const mockLoggerFatal = ((logger.fatal as unknown as Mock).mock).calls

    expect(mockExistsSync).toHaveBeenCalledWith(`${process.cwd()}/package.json`)
    expect(mockLoggerFatal).toStrictEqual([])
    expect(mockExit).not.toHaveBeenCalled()
  })
})

describe('isPrivate', () => {
  it('returns true if the package.json has a private flag', () => {
    expect(isPrivate({
      private: true,
    })).toBe(true)
  })

  it('returns false if the package.json does not have a private flag', () => {
    expect(isPrivate({
      private: false,
    })).toBe(false)
    expect(isPrivate({
      name: 'foobar',
    })).toBe(false)
  })
})
