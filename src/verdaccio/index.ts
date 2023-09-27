import type { Server } from 'node:http'
import { runServer } from 'verdaccio'
import fs from 'fs-extra'
import { intersection } from 'lodash-es'
import { logger } from '../utils/logger'
import type { Config } from '../utils/config'
import { VERDACCIO_CONFIG } from './verdaccio-config'
import { publishPackage } from './publish-package'
import { installPackages } from './install-packages'

async function startVerdaccio() {
  let resolved = false

  logger.log('[Verdaccio] Starting server...')

  // Clear Verdaccio storage
  fs.removeSync(VERDACCIO_CONFIG.storage as string)

  return Promise.race([
    new Promise<void>((resolve) => {
      // @ts-expect-error: Verdaccio's types are wrong
      runServer(VERDACCIO_CONFIG).then((app: Server) => {
        app.listen(VERDACCIO_CONFIG.port, () => {
          logger.log('[Verdaccio] Started successfully!')
          resolved = true
          resolve()
        })
      })
    }),
    new Promise((_, reject) => {
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          reject(new Error('[Verdaccio] TIMEOUT - Verdaccio didn\'t start within 10s'))
        }
      }, 10000)
    }),
  ]) as Promise<Server>
}

interface PublishPackagesAndInstallArgs {
  packagesToPublish: Array<string>
  destinationPackages: Array<string>
  packageNamesToFilePath: Map<string, string>
  ignorePackageJsonChanges: (packageName: string, contentArray: Array<string>) => () => void
  source: Config['source']
}

export async function publishPackagesAndInstall({ packageNamesToFilePath, destinationPackages, ignorePackageJsonChanges, packagesToPublish, source }: PublishPackagesAndInstallArgs) {
  await startVerdaccio()

  const versionPostfix = Date.now()
  const newlyPublishedPackageVersions: Record<string, string> = {}

  for (const packageName of packagesToPublish) {
    newlyPublishedPackageVersions[packageName] = await publishPackage({
      packageName,
      packagesToPublish,
      packageNamesToFilePath,
      versionPostfix,
      ignorePackageJsonChanges,
      source,
    })
  }

  const packagesToInstall = intersection(packagesToPublish, destinationPackages)

  await installPackages({
    packagesToInstall,
    newlyPublishedPackageVersions,
    source,
  })
}
