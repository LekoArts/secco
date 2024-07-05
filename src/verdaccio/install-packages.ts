import process from 'node:process'
import fs from 'fs-extra'
import { destr } from 'destr'
import { join } from 'pathe'
import { execa } from 'execa'
import { logger } from '../utils/logger'
import type { PromisifiedSpawnArgs } from '../utils/promisified-spawn'
import { promisifiedSpawn } from '../utils/promisified-spawn'
import type { Destination, PackageJson } from '../types'
import { getAbsolutePathsForDestinationPackages } from '../utils/initial-setup'
import { setNpmTagInDeps } from '../utils/set-npm-tag-in-deps'
import { getAddDependenciesCmd, getInstallCmd } from './add-dependencies'
import { REGISTRY_URL } from './verdaccio-config'

interface InstallPackagesArgs {
  packagesToInstall: Array<string>
  newlyPublishedPackageVersions: Record<string, string>
  destination: Destination
}

export async function installPackages({ newlyPublishedPackageVersions, packagesToInstall, destination }: InstallPackagesArgs) {
  const { pm, hasWorkspaces } = destination
  const { name, majorVersion } = pm

  const listOfPackagesToInstall = packagesToInstall.map(p => ` - ${p}`).join('\n')
  logger.log(`Installing packages from local registry:\n${listOfPackagesToInstall}`)

  let externalRegistry = false
  let env: NodeJS.ProcessEnv = {}

  // Yarn Berry
  if (name === 'yarn' && (majorVersion === '3' || majorVersion === '4')) {
    externalRegistry = true

    await execa`yarn config set npmRegistryServer ${REGISTRY_URL}`
    await execa`yarn config set unsafeHttpWhitelist --json ["localhost"]`
  }

  if (name === 'bun') {
    externalRegistry = true
    env = { BUN_CONFIG_REGISTRY: REGISTRY_URL }
  }

  let installCmd!: PromisifiedSpawnArgs

  if (hasWorkspaces) {
    const absolutePaths = getAbsolutePathsForDestinationPackages()

    absolutePaths.forEach((absPath) => {
      const pkgJsonPath = join(absPath, 'package.json')
      const packageJson = destr<PackageJson>(fs.readFileSync(pkgJsonPath, 'utf8'))
      const { changed, updatedPkgJson } = setNpmTagInDeps({ packageJson, packagesToInstall, newlyPublishedPackageVersions })

      if (changed) {
        logger.debug(`Adjusting dependencies in ${pkgJsonPath} to use newly published versions.`)

        fs.outputJSONSync(pkgJsonPath, updatedPkgJson, { spaces: 2 })
      }
    })

    installCmd = getInstallCmd({ pm, externalRegistry, env })
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
