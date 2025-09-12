import fs from 'fs-extra'
import { vi } from 'vitest'
import { getPackageVersion, getSourcePackageJsonPath, pathExists } from '../file'

describe('pathExists', () => {
  it('should return true for an existing file', async () => {
    const result = await pathExists(__filename)
    expect(result).toBe(true)
  })

  it('should return false for a non-existing file', async () => {
    const result = await pathExists('/path/to/non/existing/file')
    expect(result).toBe(false)
  })
})

describe('getPackageVersion', () => {
  it('should return "latest" as a fallback', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{}')

    expect(getPackageVersion('foo')).toBe('latest')
  })
  it('should return version from dependencies', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{"dependencies":{"foo":"1.0.0"}}')

    expect(getPackageVersion('foo')).toBe('1.0.0')
  })
  it('should return version from devDependencies', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{"devDependencies":{"foo":"1.0.0"}}')

    expect(getPackageVersion('foo')).toBe('1.0.0')
  })
})

describe('getSourcePackageJsonPath', () => {
  it('should return null if the package is not found', () => {
    const packageNamesToFilePath = new Map<string, string>([['foo', '/path/to/foo']])

    expect(getSourcePackageJsonPath('bar', packageNamesToFilePath)).toBeNull()
  })
  it('should return the path to the package.json file', () => {
    const packageNamesToFilePath = new Map<string, string>([['foo', '/path/to/foo']])

    expect(getSourcePackageJsonPath('foo', packageNamesToFilePath)).toBe('/path/to/foo/package.json')
  })
})

describe('getPackageJson', () => {
  let getPackageJson: any

  beforeEach(async () => {
    vi.resetModules()
    // Import fresh module for each test
    const fileModule = await import('../file')
    getPackageJson = fileModule.getPackageJson
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should read and parse package.json file', () => {
    const mockPackageJson = {
      name: 'test-package',
      version: '1.0.0',
      files: ['dist', 'CHANGELOG.md'],
    }

    vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(mockPackageJson))

    const result = getPackageJson('/path/to/package')

    expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/package/package.json', 'utf8')
    expect(result).toEqual(mockPackageJson)
  })

  it('should cache package.json content and not read file again', () => {
    const mockPackageJson = {
      name: 'test-package',
      version: '1.0.0',
    }

    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockPackageJson))

    // First call
    const result1 = getPackageJson('/path/to/cached-package')
    // Second call with same path
    const result2 = getPackageJson('/path/to/cached-package')

    expect(fs.readFileSync).toHaveBeenCalledTimes(1)
    expect(result1).toEqual(mockPackageJson)
    expect(result2).toEqual(mockPackageJson)
  })

  it('should handle different package paths separately', () => {
    const mockPackageJson1 = { name: 'package1', version: '1.0.0' }
    const mockPackageJson2 = { name: 'package2', version: '2.0.0' }

    vi.spyOn(fs, 'readFileSync')
      .mockReturnValueOnce(JSON.stringify(mockPackageJson1))
      .mockReturnValueOnce(JSON.stringify(mockPackageJson2))

    const result1 = getPackageJson('/path/to/package1')
    const result2 = getPackageJson('/path/to/package2')

    expect(fs.readFileSync).toHaveBeenCalledTimes(2)
    expect(fs.readFileSync).toHaveBeenNthCalledWith(1, '/path/to/package1/package.json', 'utf8')
    expect(fs.readFileSync).toHaveBeenNthCalledWith(2, '/path/to/package2/package.json', 'utf8')
    expect(result1).toEqual(mockPackageJson1)
    expect(result2).toEqual(mockPackageJson2)
  })

  it('should handle invalid JSON gracefully', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('invalid json')

    const result = getPackageJson('/path/to/invalid-package')

    expect(result).toBe('invalid json') // destr returns the original string for invalid JSON
  })

  it('should handle package.json with files field', () => {
    const mockPackageJson = {
      name: 'test-package',
      version: '1.0.0',
      files: ['dist', '*.md', 'lib/**/*'],
    }

    vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(mockPackageJson))

    const result = getPackageJson('/path/to/files-package')

    expect(result).toEqual(mockPackageJson)
    expect(result?.files).toEqual(['dist', '*.md', 'lib/**/*'])
  })

  it('should throw error for missing package.json', () => {
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory')
    })

    // The function should throw since it doesn't have error handling
    expect(() => getPackageJson('/path/to/missing-package')).toThrow('ENOENT: no such file or directory')
  })
})
