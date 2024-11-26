/**
 * Copied from the pnpm source code
 */

import util from 'node:util'
import { join } from 'pathe'
import { readYamlFile } from './read-yaml-file'

const WORKSPACE_MANIFEST_FILENAME = 'pnpm-workspace.yaml'

export interface Catalogs {
  readonly default?: Catalog
  readonly [catalogName: string]: Catalog | undefined
}

export interface Catalog {
  readonly [dependencyName: string]: string | undefined
}

interface WorkspaceNamedCatalogs {
  readonly [catalogName: string]: WorkspaceCatalog
}

interface WorkspaceCatalog {
  readonly [dependencyName: string]: string
}

interface WorkspaceManifest {
  packages: Array<string>
  catalog?: WorkspaceCatalog
  catalogs?: WorkspaceNamedCatalogs
}

export function getCatalogsFromWorkspaceManifest(
  workspaceManifest: Pick<WorkspaceManifest, 'catalog' | 'catalogs'> | undefined,
): Catalogs {
  if (workspaceManifest == null) {
    return {}
  }

  return {
    default: workspaceManifest.catalog,
    ...workspaceManifest.catalogs,
  }
}

function readManifestRaw(dir: string): unknown | undefined {
  try {
    return readYamlFile(join(dir, WORKSPACE_MANIFEST_FILENAME))
  }
  catch (err: unknown) {
    if (util.types.isNativeError(err) && 'code' in err && err.code === 'ENOENT') {
      return undefined
    }

    throw err
  }
}

export function readWorkspaceManifest(dir: string) {
  return readManifestRaw(dir) as WorkspaceManifest | undefined
}
