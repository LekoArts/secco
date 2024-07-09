/* eslint-disable ts/no-namespace */
import type { PackageManager } from 'nypm'
import type { Config } from './utils/config'

export type PackageNames = Array<string>
export type PackageNamesToFilePath = Map<string, string>
export type AbsolutePathsForDestinationPackages = Set<string>
export type SourcePackages = Array<string>
export type DestinationPackages = Array<string>
export type DepTree = Record<string, Set<string>>

export interface CliArguments {
  scanOnce: boolean
  forceVerdaccio: boolean
  verbose: boolean
  packageNames?: PackageNames
}

export type WatcherOptions = Omit<CliArguments, 'packageNames'>

export type Source = Config['source'] & {
  hasWorkspaces: boolean
  packages: SourcePackages
  packageNamesToFilePath: PackageNamesToFilePath
  pm: PackageManager | undefined
}

export interface Destination {
  hasWorkspaces: boolean
  packages: DestinationPackages
  absolutePathsForDestinationPackages: AbsolutePathsForDestinationPackages
  pm: PackageManager
}

export interface PackageJson {
  name?: string
  version?: string
  private?: boolean
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  workspaces?: Array<string> | { packages: Array<string> }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      INTEGRATION_PM_NAME?: 'npm' | 'pnpm' | 'yarn' | 'bun'
      INTEGRATION_PM_VERSION?: string
      SECCO_VERDACCIO_PORT?: string
      CI?: string
      GITHUB_ACTIONS?: string
      RUNNER_TEMP?: string
    }
  }
}
