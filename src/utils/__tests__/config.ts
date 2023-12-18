import process from 'node:process'
import { read } from 'rc9'
import type { Mock } from 'vitest'
import { getConfig } from '../config'
import { logger } from '../logger'

vi.mock('rc9', async () => {
  const mod = await vi.importActual<typeof import('rc9')>('rc9')
  return {
    ...mod,
    read: vi.fn(),
  }
})

describe('getConfig', () => {
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

  beforeEach(() => {
    logger.mockTypes(() => vi.fn())
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  afterAll(() => {
    mockExit.mockRestore()
  })

  it('should return source.path from SECCO_SOURCE_PATH env var', () => {
    const srcPath = '/path/to/source'
    vi.stubEnv('SECCO_SOURCE_PATH', srcPath)

    expect(getConfig().source.path).toBe(srcPath)

    vi.unstubAllEnvs()
  })
  it('should error when no env var is set and no .seccorc file can be found', () => {
    (read as unknown as Mock).mockReturnValue({})

    getConfig()

    const mockLoggerFatal = ((logger.fatal as unknown as Mock).mock).calls[0][0]

    expect(mockLoggerFatal).toContain('No `.seccorc` file found in')
    expect(mockLoggerFatal).toContain('Please run `secco init` to create a new `.seccorc` file.')
  })
  it('should error when no source.path is found in .seccorc', () => {
    (read as unknown as Mock).mockReturnValue({
      source: {
        cwd: '/path/to/source',
      },
    })

    getConfig()

    const mockLoggerFatal = ((logger.fatal as unknown as Mock).mock).calls[0][0]

    expect(mockLoggerFatal).toContain('Errors parsing your `.seccorc` file')
    expect(mockLoggerFatal).toContain(`- source.path
  - source.path is required and must be a string
- source.cwd
  - Invalid type`)
  })
  it('should error when source.path is not an absolute path', () => {
    (read as unknown as Mock).mockReturnValue({
      source: {
        path: 'path/to/source',
      },
    })

    getConfig()

    const mockLoggerFatal = ((logger.fatal as unknown as Mock).mock).calls[0][0]

    expect(mockLoggerFatal).toContain('Errors parsing your `.seccorc` file')
    expect(mockLoggerFatal).toContain(`- source.path
  - source.path must be an absolute path`)
  })
  it('should return source.path from valid .seccorc file', () => {
    const srcPath = '/path/to/source';

    (read as unknown as Mock).mockReturnValue({
      source: {
        path: srcPath,
      },
    })

    expect(getConfig().source.path).toBe(srcPath)
  })
})
