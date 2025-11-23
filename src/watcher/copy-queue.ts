import type { Source } from '../types'
import fs from 'fs-extra'
import { relative } from 'pathe'
import { logger } from '../utils/logger'

const MAX_COPY_RETRIES = 3

interface CopyPathArgs {
  oldPath: string
  newPath: string
  packageName: string
}

interface CopyJob extends CopyPathArgs {
  resolve: (value: void | PromiseLike<void>) => void
  reject: (err: Error) => void
  retry?: number
}

/**
 * Manages a queue of file copy operations with retry logic.
 * Files can be queued before package installation and processed afterwards.
 */
export class CopyQueue {
  private queue: Array<CopyJob> = []
  private isReady = false
  private numCopied = 0
  private sourcePath: string

  constructor(sourcePath: Source['path']) {
    this.sourcePath = sourcePath
  }

  /**
   * Add a file copy operation to the queue or execute immediately if ready
   */
  enqueue(args: CopyPathArgs): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const job = { ...args, resolve, reject }

      if (this.isReady) {
        this._executeCopy(job)
      }
      else {
        this.queue.push(job)
      }
    })
  }

  /**
   * Mark the queue as ready and process all queued copies
   */
  processQueue(): void {
    this.isReady = true
    this.queue.forEach(job => this._executeCopy(job))
    this.queue = []
  }

  /**
   * Get the number of files copied
   */
  getNumCopied(): number {
    return this.numCopied
  }

  /**
   * Reset the copy counter (useful for testing)
   */
  resetCounter(): void {
    this.numCopied = 0
  }

  /**
   * Internal: Execute a file copy with exponential backoff retry logic
   */
  private _executeCopy(job: CopyJob): void {
    const { oldPath, newPath, resolve, reject, retry = 0 } = job

    fs.copy(oldPath, newPath, (err) => {
      if (err) {
        if (retry >= MAX_COPY_RETRIES) {
          logger.error(err)
          reject(err)
          return
        }

        // Exponential backoff: 500ms, 1000ms, 2000ms
        setTimeout(
          () => this._executeCopy({ ...job, retry: retry + 1 }),
          500 * 2 ** retry,
        )
        return
      }

      // TODO(feature): Handle case where copied file needs to be executable. Use fs.chmodSync(newPath, '0755') for that.

      this.numCopied += 1
      logger.log(`Copied \`${relative(this.sourcePath, oldPath)}\` to \`${newPath}\``)

      resolve()
    })
  }
}
