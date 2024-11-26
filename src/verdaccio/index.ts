import type { Server } from 'node:http'
import type { Destination, PackageNamesToFilePath, Source } from '../types'
import fs from 'fs-extra'
import { intersection } from 'lodash-es'
import { customAlphabet } from 'nanoid/non-secure'
import { runServer } from 'verdaccio'
import { logger } from '../utils/logger'
import { installPackages } from './install-packages'
import { publishPackage } from './publish-package'
import { VERDACCIO_CONFIG } from './verdaccio-config'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 4)

async function startVerdaccio() {
  let resolved = false

  logger.log('[Verdaccio] Starting server...')
  logger.debug(`[Verdaccio] Port: ${VERDACCIO_CONFIG.port}`)

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

export type PublishPackageArgs = Omit<PublishPackagesAndInstallArgs, 'destination'> & {
  packageName: string
  versionPostfix: string
}

export type AdjustPackageJsonArgs = Omit<PublishPackageArgs, 'source'> & {
  sourcePkgJsonPath: string
}

export interface PublishPackagesAndInstallArgs {
  packagesToPublish: Array<string>
  packageNamesToFilePath: PackageNamesToFilePath
  ignorePackageJsonChanges: (packageName: string, contentArray: Array<string>) => () => void
  source: Source
  destination: Destination
}

export async function publishPackagesAndInstall({ packageNamesToFilePath, ignorePackageJsonChanges, packagesToPublish, source, destination }: PublishPackagesAndInstallArgs) {
  await startVerdaccio()

  const versionPostfix = `${Date.now()}-${nanoid()}`
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

  const packagesToInstall = intersection(packagesToPublish, destination.packages)

  await installPackages({
    packagesToInstall,
    newlyPublishedPackageVersions,
    destination,
  })
}
