import type { Mock } from 'vitest'
import { execaSync } from 'execa'
import fs from 'fs-extra'
import { createTempNpmRc } from '../create-temp-npm-rc'

vi.mock('fs-extra')
vi.mock('execa')

describe('createTempNpmRc', () => {
  const pathToPkg = '/path/to/pkg'
  const sourcePath = '/path/to/source'
  const authToken = 'issued-token'

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should create .npmrc files if they do not exist', () => {
    (fs.existsSync as unknown as Mock).mockReturnValueOnce(false);
    (fs.existsSync as unknown as Mock).mockReturnValueOnce(false)

    createTempNpmRc({ pathToPkg, sourcePath, authToken })

    expect(fs.outputFileSync).toHaveBeenCalledTimes(2)
    expect(fs.outputFileSync).toHaveBeenCalledWith('/path/to/pkg/.npmrc', '//localhost:4873/:_authToken="issued-token"')
    expect(fs.outputFileSync).toHaveBeenCalledWith('/path/to/source/.npmrc', '//localhost:4873/:_authToken="issued-token"')
    expect(execaSync).not.toHaveBeenCalled()
  })

  it('should use "npm config set" if .npmrc files already exist', () => {
    (fs.existsSync as unknown as Mock).mockReturnValueOnce(true);
    (fs.existsSync as unknown as Mock).mockReturnValueOnce(true)

    createTempNpmRc({ pathToPkg, sourcePath, authToken })

    expect(fs.outputFileSync).not.toHaveBeenCalled()
    expect(execaSync).toHaveBeenCalledTimes(2)
    expect(execaSync).toHaveBeenCalledWith('npm', ['config', 'set', '//localhost:4873/:_authToken="issued-token"'], { cwd: '/path/to/pkg' })
    expect(execaSync).toHaveBeenCalledWith('npm', ['config', 'set', '//localhost:4873/:_authToken="issued-token"'], { cwd: '/path/to/source' })
  })

  it('should revert changes and remove .npmrc files on cleanup', () => {
    (fs.existsSync as unknown as Mock).mockReturnValueOnce(true);
    (fs.existsSync as unknown as Mock).mockReturnValueOnce(false)

    const cleanupTask = createTempNpmRc({ pathToPkg, sourcePath, authToken })
    cleanupTask()

    expect(execaSync).toHaveBeenCalledTimes(2)
    expect(execaSync).toHaveBeenCalledWith('npm', ['config', 'delete', '//localhost:4873/:_authToken'], { cwd: '/path/to/pkg' })
    expect(fs.outputFileSync).toHaveBeenCalledWith('/path/to/source/.npmrc', '//localhost:4873/:_authToken="issued-token"')
    expect(fs.removeSync).toHaveBeenCalledTimes(1)
    expect(fs.removeSync).toHaveBeenCalledWith('/path/to/source/.npmrc')
  })
})
