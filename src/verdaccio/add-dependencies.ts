import type { PackageManager } from 'nypm'
import type { PromisifiedSpawnArgs } from '../utils/promisified-spawn'
import { REGISTRY_URL } from './verdaccio-config'

// TODO(feature): Handle workspaces

interface GetAddDependenciesCmdArgs {
  packages: Array<string>
  pm: PackageManager
  externalRegistry?: boolean
}

export function getAddDependenciesCmd({ packages, pm, externalRegistry = false }: GetAddDependenciesCmdArgs) {
  const commands: PromisifiedSpawnArgs = [pm.command, [pm.name === 'npm' ? 'install' : 'add', ...packages, '--exact', !externalRegistry ? `--registry=${REGISTRY_URL}` : null].filter(Boolean)]

  return commands
}
