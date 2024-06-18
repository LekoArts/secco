import process from 'node:process'
import { read } from 'rc9'
import type { Mock } from 'vitest'
import { parse } from 'valibot'
import { ConfigSchema, getConfig, isEmpty, sourcePathSchema } from '../config'
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
  - \`source.path\` is required and must be a string
- source.cwd
  - Only the key \`source.path\` is allowed`)
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
  - \`source.path\` must be an absolute path`)
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

describe('isEmpty', () => {
  it('should return true for an empty object', () => {
    const input = {}
    const result = isEmpty(input)
    expect(result).toBe(true)
  })

  it('should return false for a non-empty object', () => {
    const input = { key: 'value' }
    const result = isEmpty(input)
    expect(result).toBe(false)
  })

  it('should return false for a non-object input', () => {
    const input = 'not an object'
    const result = isEmpty(input)
    expect(result).toBe(false)
  })
})

describe('sourcePathSchema', () => {
  it('should only pass strings', () => {
    const schema = sourcePathSchema('test')
    const input = '/'
    const output = parse(schema, input)
    const error = '\`test\` is required and must be a string'

    expect(output).toBe(input)
    expect(() => parse(schema, 123)).toThrowError(error)
    expect(() => parse(schema, {})).toThrowError(error)
  })
  it('should trim the input', () => {
    const schema = sourcePathSchema('test')
    const input = ' / '
    const output = parse(schema, input)

    expect(output).toBe('/')
  })
  it('should only pass absolute paths', () => {
    const schema = sourcePathSchema('test')
    const input = '/path/to/source'
    const output = parse(schema, input)

    expect(output).toBe(input)
    expect(() => parse(schema, 'path/to/source')).toThrowError('\`test\` must be an absolute path')
  })
})

describe('configSchema', () => {
  it('should only pass objects', () => {
    const input = {
      source: {
        path: '/path/to/source',
      },
    }
    const output = parse(ConfigSchema, input)
    expect(output).toEqual(input)
    expect(() => parse(ConfigSchema, '/path/to/source')).toThrowError('You must pass an object')
  })
  it('should only pass objects with valid entries', () => {
    expect(() => parse(ConfigSchema, {})).toThrowError('Only the key `source.path` is allowed')
    expect(() => parse(ConfigSchema, { invalid: 'key' })).toThrowError('Only the key `source.path` is allowed')
    expect(() => parse(ConfigSchema, { source: { invalid: 'key' } })).toThrowError('\`source.path\` is required and must be a string')
  })
})
