import type { Mock } from 'vitest'
import fs from 'fs-extra'
import { prepareGracefulExit } from '../../verdaccio/cleanup-tasks'
import { createTempNpmRc } from '../create-temp-npm-rc'

vi.mock('fs-extra')

describe('createTempNpmRc', () => {
  const pathToPkg = '/path/to/pkg'
  const sourcePath = '/path/to/source'
  const authToken = 'issued-token'
  const tokenLine = '//localhost:4873/:_authToken="issued-token"'

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should create .npmrc files if they do not exist and remove them on cleanup', () => {
    (fs.existsSync as unknown as Mock).mockReturnValue(false)

    const cleanup = createTempNpmRc({ pathToPkg, sourcePath, authToken })

    expect(fs.outputFileSync).toHaveBeenCalledTimes(2)
    expect(fs.outputFileSync).toHaveBeenCalledWith('/path/to/pkg/.npmrc', tokenLine)
    expect(fs.outputFileSync).toHaveBeenCalledWith('/path/to/source/.npmrc', tokenLine)

    cleanup()

    expect(fs.removeSync).toHaveBeenCalledWith('/path/to/pkg/.npmrc')
    expect(fs.removeSync).toHaveBeenCalledWith('/path/to/source/.npmrc')
  })

  it('should append the token to existing .npmrc files and restore their original contents on cleanup', () => {
    const originals: Record<string, string> = {
      '/path/to/pkg/.npmrc': 'save-exact=true\n',
      '/path/to/source/.npmrc': 'auto-install-peers=false',
    };
    (fs.existsSync as unknown as Mock).mockReturnValue(true);
    (fs.readFileSync as unknown as Mock).mockImplementation((p: string) => originals[p])

    const cleanup = createTempNpmRc({ pathToPkg, sourcePath, authToken })

    expect(fs.outputFileSync).toHaveBeenCalledWith('/path/to/pkg/.npmrc', `save-exact=true\n${tokenLine}\n`)
    expect(fs.outputFileSync).toHaveBeenCalledWith('/path/to/source/.npmrc', `auto-install-peers=false\n${tokenLine}\n`)

    vi.mocked(fs.outputFileSync).mockClear()
    cleanup()

    expect(fs.removeSync).not.toHaveBeenCalled()
    expect(fs.outputFileSync).toHaveBeenCalledWith('/path/to/pkg/.npmrc', originals['/path/to/pkg/.npmrc'])
    expect(fs.outputFileSync).toHaveBeenCalledWith('/path/to/source/.npmrc', originals['/path/to/source/.npmrc'])
  })

  it('should revert already written .npmrc files when a later write fails', () => {
    (fs.existsSync as unknown as Mock).mockReturnValue(false);
    (fs.outputFileSync as unknown as Mock)
      .mockImplementationOnce(() => {})
      .mockImplementationOnce(() => {
        throw new Error('EACCES')
      })

    expect(() => createTempNpmRc({ pathToPkg, sourcePath, authToken })).toThrow('EACCES')

    // Process exit runs registered cleanup tasks
    prepareGracefulExit()

    expect(fs.removeSync).toHaveBeenCalledWith('/path/to/pkg/.npmrc')
  })

  it('should only touch the .npmrc once when the package is the source root', () => {
    (fs.existsSync as unknown as Mock).mockReturnValue(false)

    const cleanup = createTempNpmRc({ pathToPkg: sourcePath, sourcePath, authToken })
    cleanup()

    expect(fs.outputFileSync).toHaveBeenCalledTimes(1)
    expect(fs.removeSync).toHaveBeenCalledTimes(1)
  })
})
