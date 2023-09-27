export const CONFIG_FILE_NAME = '.seccorc'
export const FILESPY_SKIP = ['node_modules', '.git', '.DS_Store', '__tests__', '__mocks__', '.npmrc', '+(*.)+(spec|test).+(js|ts)', '+(*.)+(d).ts']
export const WATCH_EVENTS = ['change', 'add'] as const
export const NPM_DIST_TAG = 'secco'

export interface CliArguments {
  scanOnce: boolean
  forceVerdaccio: boolean
  verbose: boolean
  packageNames?: Array<string>
}
