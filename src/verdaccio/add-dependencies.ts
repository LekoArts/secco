import type { PackageManager, PackageManagerName } from 'nypm'
import type { PromisifiedSpawnArgs } from '../utils/promisified-spawn'
import { REGISTRY_URL } from './verdaccio-config'

interface GetAddDependenciesCmdArgs {
  packages: Array<string>
  pm: PackageManager
  externalRegistry?: boolean
  env?: NodeJS.ProcessEnv
}

interface GetInstallCmdArgs {
  pm: PackageManager
  externalRegistry?: boolean
  env?: NodeJS.ProcessEnv
}

const addMap: Partial<Record<PackageManagerName, 'install' | 'add'>> = {
  npm: 'install',
  pnpm: 'add',
  yarn: 'add',
  bun: 'add',
  // TODO: Add proper support for Deno
  deno: 'add',
}

const exactMap: Partial<Record<PackageManagerName, '--save-exact' | '--exact'>> = {
  npm: '--save-exact',
  pnpm: '--save-exact',
  yarn: '--exact',
  bun: '--exact',
  // TODO: There doesn't seem to be an --exact flag in Deno
  deno: '--exact',
}

export function getAddDependenciesCmd({ packages, pm, externalRegistry = false, env = {} }: GetAddDependenciesCmdArgs) {
  if (!addMap[pm.name] || !exactMap[pm.name]) {
    throw new Error(`Unsupported package manager: ${pm.name}`)
  }

  const commands: PromisifiedSpawnArgs = [pm.command, [addMap[pm.name], ...packages, exactMap[pm.name], !externalRegistry ? `--registry=${REGISTRY_URL}` : null, pm.name === 'npm' ? '--legacy-peer-deps' : null].filter(Boolean), { env }]

  return commands
}

export function getInstallCmd({ pm, externalRegistry = false, env = {} }: GetInstallCmdArgs) {
  if (!addMap[pm.name]) {
    throw new Error(`Unsupported package manager: ${pm.name}`)
  }

  const commands: PromisifiedSpawnArgs = [pm.command, ['install', !externalRegistry ? `--registry=${REGISTRY_URL}` : null].filter(Boolean), { env }]

  return commands
}
