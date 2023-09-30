import type { PackageManager } from 'nypm'
import type { Config } from './utils/config'

export type PackageNames = Array<string>
export type PackageNamesToFilePath = Map<string, string>
export type SourcePackages = Array<string>
export type DestinationPackages = Array<string>

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
  packages: DestinationPackages
}

export interface PackageJson {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  workspaces?: Array<string> | { packages: Array<string> }
}
