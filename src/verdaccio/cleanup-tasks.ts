/* eslint-disable ts/no-unsafe-function-type */
import { onExit } from 'signal-exit'
import { logger } from '../utils/logger'

const cleanupTasks: Set<Function> = new Set()
let isGracefulExit = false

export function registerCleanupTask<F extends Function>(taskFn: F) {
  cleanupTasks.add(taskFn)

  return () => {
    const result = taskFn()
    cleanupTasks.delete(taskFn)
    return result
  }
}

export function prepareGracefulExit() {
  isGracefulExit = true
  cleanupTasks.forEach(taskFn => taskFn())
  cleanupTasks.clear()
}

onExit((code) => {
  if (cleanupTasks.size > 0 && !isGracefulExit) {
    logger.warn(`Process exited with code ${code}. Cleaning up...`)
    cleanupTasks.forEach(taskFn => taskFn())
  }
})
