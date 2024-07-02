import process from 'node:process'
import { detectPackageManager } from 'nypm'
import { logger } from '../utils/logger'
import type { PromisifiedSpawnArgs } from '../utils/promisified-spawn'
import { promisifiedSpawn } from '../utils/promisified-spawn'
import { getAddDependenciesCmd } from './add-dependencies'
import { REGISTRY_URL } from './verdaccio-config'

interface InstallPackagesArgs {
  packagesToInstall: Array<string>
  newlyPublishedPackageVersions: Record<string, string>
}

export async function installPackages({ newlyPublishedPackageVersions, packagesToInstall }: InstallPackagesArgs) {
  const cwd = process.cwd()
  const pm = await detectPackageManager(cwd, { includeParentDirs: false })
  logger.debug(`Detected package manager in destination: ${pm?.name}`)

  if (!pm) {
    logger.fatal(`Failed to detect package manager in ${cwd}

If you have control over the destination, manually add the "packageManager" key to its \`package.json\` file.`)
    process.exit()
  }

  const listOfPackagesToInstall = packagesToInstall.map(p => ` - ${p}`).join('\n')
  logger.log(`Installing packages from local registry:\n${listOfPackagesToInstall}`)

  const { name, majorVersion } = pm

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
