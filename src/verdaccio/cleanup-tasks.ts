/* eslint-disable ts/ban-types */
import { onExit } from 'signal-exit'
import { logger } from '../utils/logger'

const cleanupTasks: Set<Function> = new Set()

export function registerCleanupTask<F extends Function>(taskFn: F) {
  cleanupTasks.add(taskFn)

  return () => {
    const result = taskFn()
    cleanupTasks.delete(taskFn)
    return result
  }
}

onExit((code) => {
  if (cleanupTasks.size > 0) {
    logger.warn(`Process exitted with code ${code} in the middle of publishing. Cleaning up...`)
    cleanupTasks.forEach(taskFn => taskFn())
  }
})
