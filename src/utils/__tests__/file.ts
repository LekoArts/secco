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
