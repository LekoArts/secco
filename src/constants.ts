export const CONFIG_FILE_NAME = '.seccorc'

export interface CliArguments {
  scanOnce: boolean
  forceVerdaccio: boolean
  verbose: boolean
  packageNames?: Array<string>
}
