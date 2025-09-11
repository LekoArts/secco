import { vi } from 'vitest'
import { getCatalogsFromWorkspaceManifest, readWorkspaceManifest } from '../pnpm'
import { readYamlFile } from '../read-yaml-file'

vi.mock('../read-yaml-file')

describe('getCatalogsFromWorkspaceManifest', () => {
  it('should return empty object when workspaceManifest is undefined', () => {
    const result = getCatalogsFromWorkspaceManifest(undefined)

    expect(result).toEqual({})
  })

  it('should return empty object when workspaceManifest is null', () => {
    const result = getCatalogsFromWorkspaceManifest(null as any)

    expect(result).toEqual({})
  })

  it('should return only default catalog when only catalog is present', () => {
    const workspaceManifest = {
      catalog: {
        react: '18.0.0',
        lodash: '4.17.21',
      },
    }

    const result = getCatalogsFromWorkspaceManifest(workspaceManifest)

    expect(result).toEqual({
      default: {
        react: '18.0.0',
        lodash: '4.17.21',
      },
    })
  })

  it('should return named catalogs when only catalogs is present', () => {
    const workspaceManifest = {
      catalogs: {
        react: {
          'react': '18.0.0',
          'react-dom': '18.0.0',
        },
        vue: {
          vue: '3.0.0',
        },
      },
    }

    const result = getCatalogsFromWorkspaceManifest(workspaceManifest)

    expect(result).toEqual({
      react: {
        'react': '18.0.0',
        'react-dom': '18.0.0',
      },
      vue: {
        vue: '3.0.0',
      },
    })
  })

  it('should merge default catalog and named catalogs', () => {
    const workspaceManifest = {
      catalog: {
        lodash: '4.17.21',
        typescript: '5.0.0',
      },
      catalogs: {
        react: {
          'react': '18.0.0',
          'react-dom': '18.0.0',
        },
        testing: {
          vitest: '1.0.0',
        },
      },
    }

    const result = getCatalogsFromWorkspaceManifest(workspaceManifest)

    expect(result).toEqual({
      default: {
        lodash: '4.17.21',
        typescript: '5.0.0',
      },
      react: {
        'react': '18.0.0',
        'react-dom': '18.0.0',
      },
      testing: {
        vitest: '1.0.0',
      },
    })
  })
})

describe('readWorkspaceManifest', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should read and return workspace manifest', () => {
    const mockManifest = {
      packages: ['packages/*', 'apps/*'],
      catalog: {
        react: '18.0.0',
      },
      catalogs: {
        testing: {
          vitest: '1.0.0',
        },
      },
    }

    vi.mocked(readYamlFile).mockReturnValue(mockManifest)

    const result = readWorkspaceManifest('/path/to/workspace')

    expect(readYamlFile).toHaveBeenCalledWith('/path/to/workspace/pnpm-workspace.yaml')
    expect(result).toEqual(mockManifest)
  })

  it('should return undefined when pnpm-workspace.yaml does not exist', () => {
    const error = new Error('File not found') as Error & { code: string }
    error.code = 'ENOENT'

    vi.mocked(readYamlFile).mockImplementation(() => {
      throw error
    })

    const result = readWorkspaceManifest('/path/to/workspace')

    expect(result).toBeUndefined()
  })

  it('should throw error for non-ENOENT errors', () => {
    const error = new Error('Permission denied') as Error & { code: string }
    error.code = 'EACCES'

    vi.mocked(readYamlFile).mockImplementation(() => {
      throw error
    })

    expect(() => readWorkspaceManifest('/path/to/workspace')).toThrow('Permission denied')
  })

  it('should throw error for errors without code property', () => {
    const error = new Error('Unknown error')

    vi.mocked(readYamlFile).mockImplementation(() => {
      throw error
    })

    expect(() => readWorkspaceManifest('/path/to/workspace')).toThrow('Unknown error')
  })

  it('should throw error for non-Error objects', () => {
    vi.mocked(readYamlFile).mockImplementation(() => {
      throw new Error('String error')
    })

    expect(() => readWorkspaceManifest('/path/to/workspace')).toThrow()
  })
})
