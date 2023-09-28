export const CONFIG_FILE_NAME = '.seccorc'
export const WATCH_EVENTS = ['change', 'add'] as const
export const DEFAULT_IGNORED: Array<RegExp> = [/[/\\]node_modules[/\\]/i, /\.git/i, /\.DS_Store/, /[/\\]__tests__[/\\]/i, /[/\\]__mocks__[/\\]/i, /\.npmrc/i]
export const NPM_DIST_TAG = 'secco'
export const CLI_NAME = 'secco'

export interface CliArguments {
  scanOnce: boolean
  forceVerdaccio: boolean
  verbose: boolean
  packageNames?: Array<string>
}
