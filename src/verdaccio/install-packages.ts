import process from 'node:process'
import { detectPackageManager } from 'nypm'
import { logger } from '../utils/logger'
import type { PromisifiedSpawnArgs } from '../utils/promisified-spawn'
import { promisifiedSpawn } from '../utils/promisified-spawn'
import type { Config } from '../utils/config'
import { getAddDependenciesCmd } from './add-dependencies'

interface InstallPackagesArgs {
  packagesToInstall: Array<string>
  newlyPublishedPackageVersions: Record<string, string>
  source: Config['source']
}

export async function installPackages({ newlyPublishedPackageVersions, packagesToInstall, source }: InstallPackagesArgs) {
  const cwd = process.cwd()
  const pm = await detectPackageManager(cwd, { includeParentDirs: false })

  if (!pm) {
    logger.fatal(`Failed to detect package manager in ${cwd}`)
    process.exit()
  }

  const listOfPackagesToInstall = packagesToInstall.map(p => ` - ${p}`).join('\n')
  logger.log(`Installing packages from local registry:\n${listOfPackagesToInstall}`)

  // The combination of name and majorVersion allows us to detect yarn 3
  const { name, majorVersion } = pm

  // TODO(feature): Handle externalRegistry case by detecting yarn 2/3 and modify yarn config
  let externalRegistry = false

  if (name === 'yarn' && majorVersion === '3')
    externalRegistry = true

  let installCmd!: PromisifiedSpawnArgs

  if (source.type === 'monorepo') {
    // TODO(feature): Support workspace
    logger.warn('Workspaces not supported yet :(')
  }
  else {
    const packages = packagesToInstall.map((p) => {
      const pkgVersion = newlyPublishedPackageVersions[p]
      return `${p}@${pkgVersion}`
    })
    installCmd = getAddDependenciesCmd({ packages, pm, externalRegistry })
  }

  try {
    await promisifiedSpawn(installCmd)

    logger.log('Installation finished successfully!')
  }
  catch (e) {
    if (e instanceof Error) {
      logger.fatal('Installation failed.', e)
      process.exit()
    }
  }
}
