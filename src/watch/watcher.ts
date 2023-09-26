import process from 'node:process'
import { filespy } from '@lekoarts/filespy'
import { logger } from '../utils/logger'
import type { Config } from '../utils/config'
import type { CliArguments } from '../constants'

let numOfCopiedFiles = 0

numOfCopiedFiles = 1

function quit() {
  logger.info(`Copied ${numOfCopiedFiles} files`)
  process.exit()
}

type WatcherOptions = Omit<CliArguments, 'packageNames'>

export async function watcher(source: Config['source'], packages: Array<string> | undefined, options: WatcherOptions) {
  // TODO
  const spy = filespy('source-location', {
    // only => uniq PackagesToWatch
    // skip => ignored files
  })
}
