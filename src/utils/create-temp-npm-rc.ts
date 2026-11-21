import { execaSync } from 'execa'
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
 * Publishing requires an auth token in .npmrc. This is a requirement for npm and yarn 🤷🏻‍♀️. Creates an .npmrc file in the source package directory and in the source directory. If an .npmrc file already exists, it will edit the file.
 */
export function createTempNpmRc({ pathToPkg, sourcePath, authToken }: CreateTempNpmRcArgs) {
  const NpmRcContent = `${NpmRcConfigKey}="${authToken}"`
  const npmRcPathInPkg = join(pathToPkg, '.npmrc')
  const npmRcPathInSource = join(sourcePath, '.npmrc')
  let revertPkg = false
  let revertSource = false

  // If an .npmrc file already exists in the pkg and/or source root, we should use "npm config set key=value"

  if (fs.existsSync(npmRcPathInPkg)) {
    execaSync('npm', ['config', 'set', NpmRcContent], { cwd: pathToPkg })
    revertPkg = true
  }
  else { fs.outputFileSync(npmRcPathInPkg, NpmRcContent) }

  if (fs.existsSync(npmRcPathInSource)) {
    execaSync('npm', ['config', 'set', NpmRcContent], { cwd: sourcePath })
    revertSource = true
  }
  else { fs.outputFileSync(npmRcPathInSource, NpmRcContent) }

  return registerCleanupTask(() => {
    if (revertPkg)
      execaSync('npm', ['config', 'delete', NpmRcConfigKey], { cwd: pathToPkg })
    else
      fs.removeSync(npmRcPathInPkg)

    if (revertSource)
      execaSync('npm', ['config', 'delete', NpmRcConfigKey], { cwd: sourcePath })
    else
      fs.removeSync(npmRcPathInSource)
  })
}
