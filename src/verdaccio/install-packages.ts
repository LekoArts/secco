import process from 'node:process'
import { logger } from '../utils/logger'
import type { PromisifiedSpawnArgs } from '../utils/promisified-spawn'
import { promisifiedSpawn } from '../utils/promisified-spawn'
import type { Destination } from '../types'
import { getAddDependenciesCmd } from './add-dependencies'
import { REGISTRY_URL } from './verdaccio-config'

interface InstallPackagesArgs {
  packagesToInstall: Array<string>
  newlyPublishedPackageVersions: Record<string, string>
  destination: Destination
}

export async function installPackages({ newlyPublishedPackageVersions, packagesToInstall, destination }: InstallPackagesArgs) {
  const { pm } = destination
  const { name, majorVersion } = pm

  const listOfPackagesToInstall = packagesToInstall.map(p => ` - ${p}`).join('\n')
  logger.log(`Installing packages from local registry:\n${listOfPackagesToInstall}`)

  let externalRegistry = false
  let env: NodeJS.ProcessEnv = {}

  // The combination of name and majorVersion allows us to detect yarn 3
  if (name === 'yarn' && majorVersion === '3')
    externalRegistry = true
    // TODO(feature): Handle externalRegistry case by detecting yarn 2/3 and modify yarn config
    // We need to set programatically:
    // yarn config set npmRegistryServer http://localhost:4873
    // unsafeHttpWhitelist:\n - "localhost"

  if (name === 'bun') {
    externalRegistry = true
    env = { BUN_CONFIG_REGISTRY: REGISTRY_URL }
  }

  let installCmd!: PromisifiedSpawnArgs

  if (false) {
    // TODO(feature): Support workspace in destination repository
  }
  else {
    const packages = packagesToInstall.map((p) => {
      const pkgVersion = newlyPublishedPackageVersions[p]
      return `${p}@${pkgVersion}`
    })
    installCmd = getAddDependenciesCmd({ packages, pm, externalRegistry, env })
  }

  try {
    await promisifiedSpawn(installCmd)

    logger.success('Installation finished successfully!')
  }
  catch (e) {
    if (e instanceof Error) {
      logger.fatal('Installation failed', e)
      process.exit()
    }
  }
}
