import fs from 'fs-extra'
import { join } from 'pathe'
import { registerCleanupTask } from '../verdaccio/cleanup-tasks'
import { REGISTRY_URL } from '../verdaccio/verdaccio-config'

const NpmRcConfigKey = `${REGISTRY_URL.replace(/https?:/g, '')}/:_authToken`

interface CreateTempNpmRcArgs {
  pathToPkg: string
  sourcePath: string
  authToken: string
}

/**
 * Publishing requires an auth token in .npmrc. Adds the token to the .npmrc file in the source package directory and in the source directory (creating them if needed). The returned cleanup function restores the original state.
 */
export function createTempNpmRc({ pathToPkg, sourcePath, authToken }: CreateTempNpmRcArgs) {
  const npmRcLine = `${NpmRcConfigKey}="${authToken}"`
  const npmRcPaths = new Set([
    join(pathToPkg, '.npmrc'),
    join(sourcePath, '.npmrc'),
  ])
  const originalContents: Map<string, string | null> = new Map()

  const cleanup = registerCleanupTask(() => {
    for (const [npmRcPath, original] of originalContents) {
      if (original === null)
        fs.removeSync(npmRcPath)
      else
        fs.outputFileSync(npmRcPath, original)
    }
  })

  for (const npmRcPath of npmRcPaths) {
    const original = fs.existsSync(npmRcPath)
      ? fs.readFileSync(npmRcPath, 'utf-8')
      : null
    originalContents.set(npmRcPath, original)
    // Later entries win, so appending overrides any existing token for the local registry
    fs.outputFileSync(npmRcPath, original === null
      ? npmRcLine
      : `${original.trimEnd()}\n${npmRcLine}\n`)
  }

  return cleanup
}
