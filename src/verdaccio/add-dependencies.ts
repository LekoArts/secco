import type { PackageManager, PackageManagerName } from 'nypm'
import type { PromisifiedSpawnArgs } from '../utils/promisified-spawn'
import { REGISTRY_URL } from './verdaccio-config'

// TODO(feature): Handle workspaces

interface GetAddDependenciesCmdArgs {
  packages: Array<string>
  pm: PackageManager
  externalRegistry?: boolean
  env?: NodeJS.ProcessEnv
}

const installMap: Record<PackageManagerName, 'install' | 'add'> = {
  npm: 'install',
  pnpm: 'add',
  yarn: 'add',
  bun: 'add',
}

const exactMap: Record<PackageManagerName, '--save-exact' | '--exact'> = {
  npm: '--save-exact',
  pnpm: '--save-exact',
  yarn: '--exact',
  bun: '--exact',
}

export function getAddDependenciesCmd({ packages, pm, externalRegistry = false, env = {} }: GetAddDependenciesCmdArgs) {
  const commands: PromisifiedSpawnArgs = [pm.command, [installMap[pm.name], ...packages, exactMap[pm.name], !externalRegistry ? `--registry=${REGISTRY_URL}` : null].filter(Boolean), { env }]

  return commands
}
