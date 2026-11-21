import type { Server } from 'node:http'
import type { Destination, PackageNamesToFilePath, Source } from '../types'
import { randomUUID } from 'node:crypto'
import fs from 'fs-extra'
import { customAlphabet } from 'nanoid/non-secure'
import { runServer } from 'verdaccio'
import { CLI_NAME } from '../constants'
import { logger } from '../utils/logger'
import { intersection } from '../utils/underscore'
import { registerCleanupTask } from './cleanup-tasks'
import { installPackages } from './install-packages'
import { publishPackage } from './publish-package'
import { REGISTRY_URL, VERDACCIO_CONFIG } from './verdaccio-config'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 4)

// Track Verdaccio server state
let verdaccioServer: Server | null = null
let verdaccioStartupPromise: Promise<Server> | null = null
let cleanupRegistered = false
let authToken: string | null = null

async function startVerdaccio() {
  // If server is already running, return immediately
  if (verdaccioServer) {
    logger.debug('[Verdaccio] Using existing server')
    return verdaccioServer
  }

  // If server is starting, wait for the existing startup promise
  if (verdaccioStartupPromise) {
    logger.debug('[Verdaccio] Waiting for server to start...')
    return verdaccioStartupPromise
  }

  let resolved = false

  logger.log('[Verdaccio] Starting server...')
  logger.debug(`[Verdaccio] Port: ${VERDACCIO_CONFIG.port}`)

  // Clear Verdaccio storage only on first start
  fs.removeSync(VERDACCIO_CONFIG.storage as string)

  verdaccioStartupPromise = Promise.race([
    new Promise<Server>((resolve) => {
      runServer(VERDACCIO_CONFIG).then((app: Server) => {
        app.listen(VERDACCIO_CONFIG.port, () => {
          logger.log('[Verdaccio] Started successfully!')
          verdaccioServer = app
          resolved = true

          // Register cleanup task only once when server starts
          if (!cleanupRegistered) {
            registerCleanupTask(() => {
              stopVerdaccio()
            })
            cleanupRegistered = true
          }

          resolve(app)
        })
      })
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          reject(new Error('[Verdaccio] TIMEOUT - Verdaccio didn\'t start within 10s'))
        }
      }, 10000)
    }),
  ])

  try {
    const server = await verdaccioStartupPromise

    return server
  }
  catch (err) {
    verdaccioStartupPromise = null
    verdaccioServer = null
    throw err
  }
}

function stopVerdaccio() {
  if (verdaccioServer) {
    logger.debug('[Verdaccio] Stopping server...')
    verdaccioServer.close()
    verdaccioServer = null
  }
  verdaccioStartupPromise = null
  cleanupRegistered = false
  authToken = null
}

/**
 * Verdaccio only accepts auth tokens it issued itself, but npm & co. refuse to publish without one. So register a throwaway user on the local registry and use its token for publishing.
 */
async function getAuthToken() {
  if (authToken)
    return authToken

  const name = `${CLI_NAME}-${nanoid()}`
  const res = await fetch(`${REGISTRY_URL}/-/user/org.couchdb.user:${name}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name,
      password: randomUUID(),
    }),
  })

  if (!res.ok)
    throw new Error(`[Verdaccio] Failed to create user for publishing (${res.status})`)

  const { token } = await res.json() as { token: string }
  authToken = token

  return authToken
}

export type PublishPackageArgs = Omit<PublishPackagesAndInstallArgs, 'destination'> & {
  packageName: string
  versionPostfix: string
  authToken: string
}

export type AdjustPackageJsonArgs = Omit<PublishPackageArgs, 'authToken'> & {
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
  const authToken = await getAuthToken()

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
      authToken,
    })
  }

  const packagesToInstall = intersection(packagesToPublish, destination.packages)

  await installPackages({
    packagesToInstall,
    newlyPublishedPackageVersions,
    destination,
  })
}
