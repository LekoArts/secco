import type { Mock } from 'vitest'
import fs from 'fs-extra'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CopyQueue } from '../copy-queue'

// Mock dependencies
vi.mock('fs-extra', () => ({
  default: {
    copy: vi.fn(),
  },
}))

vi.mock('../../utils/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}))

// Type for the callback-based fs.copy signature we're using
type CopyFn = (
  src: string,
  dest: string,
  callback: (err: Error | null) => void,
) => void

describe('copyQueue', () => {
  let copyQueue: CopyQueue

  beforeEach(() => {
    vi.clearAllMocks()
    copyQueue = new CopyQueue('/source/path')
  })

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      expect(copyQueue.getNumCopied()).toBe(0)
    })

    it('should store source path', () => {
      const queue = new CopyQueue('/custom/source/path')
      expect(queue).toBeDefined()
    })
  })

  describe('enqueue before processQueue', () => {
    it('should queue copy operations when not ready', async () => {
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(null)
      })

      const promise = copyQueue.enqueue({
        oldPath: '/source/path/file.js',
        newPath: '/dest/node_modules/pkg/file.js',
        packageName: 'test-package',
      })

      // Should not execute immediately (queue not processed yet)
      expect(mockCopy).not.toHaveBeenCalled()

      // Process the queue
      copyQueue.processQueue()

      // Wait for the promise to resolve
      await promise

      // Now it should have been called
      expect(mockCopy).toHaveBeenCalledTimes(1)
      expect(copyQueue.getNumCopied()).toBe(1)
    })

    it('should queue multiple operations', async () => {
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(null)
      })

      const promise1 = copyQueue.enqueue({
        oldPath: '/source/path/file1.js',
        newPath: '/dest/node_modules/pkg/file1.js',
        packageName: 'test-package',
      })

      const promise2 = copyQueue.enqueue({
        oldPath: '/source/path/file2.js',
        newPath: '/dest/node_modules/pkg/file2.js',
        packageName: 'test-package',
      })

      const promise3 = copyQueue.enqueue({
        oldPath: '/source/path/file3.js',
        newPath: '/dest/node_modules/pkg/file3.js',
        packageName: 'test-package',
      })

      // Should not execute immediately
      expect(mockCopy).not.toHaveBeenCalled()

      // Process the queue
      copyQueue.processQueue()

      // Wait for all promises
      await Promise.all([promise1, promise2, promise3])

      // All should have been called
      expect(mockCopy).toHaveBeenCalledTimes(3)
      expect(copyQueue.getNumCopied()).toBe(3)
    })
  })

  describe('enqueue after processQueue', () => {
    it('should execute immediately when queue is ready', async () => {
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(null)
      })

      // Process queue first (mark as ready)
      copyQueue.processQueue()

      const promise = copyQueue.enqueue({
        oldPath: '/source/path/file.js',
        newPath: '/dest/node_modules/pkg/file.js',
        packageName: 'test-package',
      })

      // Should execute immediately
      await promise

      expect(mockCopy).toHaveBeenCalledTimes(1)
      expect(copyQueue.getNumCopied()).toBe(1)
    })

    it('should execute multiple operations immediately when ready', async () => {
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(null)
      })

      // Mark as ready
      copyQueue.processQueue()

      const promise1 = copyQueue.enqueue({
        oldPath: '/source/path/file1.js',
        newPath: '/dest/node_modules/pkg/file1.js',
        packageName: 'test-package',
      })

      const promise2 = copyQueue.enqueue({
        oldPath: '/source/path/file2.js',
        newPath: '/dest/node_modules/pkg/file2.js',
        packageName: 'test-package',
      })

      await Promise.all([promise1, promise2])

      expect(mockCopy).toHaveBeenCalledTimes(2)
      expect(copyQueue.getNumCopied()).toBe(2)
    })
  })

  describe('retry logic', () => {
    it('should retry on failure with exponential backoff', async () => {
      vi.useFakeTimers()
      const mockCopy = fs.copy as unknown as Mock<CopyFn>

      let attemptCount = 0
      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        attemptCount++
        if (attemptCount < 3) {
          callback(new Error('EACCES: permission denied'))
        }
        else {
          callback(null)
        }
      })

      copyQueue.processQueue() // Mark as ready

      const promise = copyQueue.enqueue({
        oldPath: '/source/path/file.js',
        newPath: '/dest/node_modules/pkg/file.js',
        packageName: 'test-package',
      })

      // First attempt (immediate)
      await vi.advanceTimersByTimeAsync(0)
      expect(attemptCount).toBe(1)

      // Second attempt (after 500ms)
      await vi.advanceTimersByTimeAsync(500)
      expect(attemptCount).toBe(2)

      // Third attempt (after 1000ms)
      await vi.advanceTimersByTimeAsync(1000)
      expect(attemptCount).toBe(3)

      await promise

      expect(copyQueue.getNumCopied()).toBe(1)

      vi.useRealTimers()
    })

    it('should fail after MAX_COPY_RETRIES attempts', async () => {
      vi.useFakeTimers()
      const mockCopy = fs.copy as unknown as Mock<CopyFn>

      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(new Error('EACCES: permission denied'))
      })

      copyQueue.processQueue() // Mark as ready

      const promise = copyQueue.enqueue({
        oldPath: '/source/path/file.js',
        newPath: '/dest/node_modules/pkg/file.js',
        packageName: 'test-package',
      })

      // Catch the promise rejection to prevent unhandled rejection
      promise.catch(() => {})

      // Advance through all retry attempts
      // Attempt 1: immediate
      await vi.advanceTimersByTimeAsync(0)
      // Attempt 2: 500ms
      await vi.advanceTimersByTimeAsync(500)
      // Attempt 3: 1000ms
      await vi.advanceTimersByTimeAsync(1000)
      // Attempt 4: 2000ms (final attempt)
      await vi.advanceTimersByTimeAsync(2000)

      await expect(promise).rejects.toThrow('EACCES: permission denied')

      // Should have tried 4 times total (initial + 3 retries)
      expect(mockCopy).toHaveBeenCalledTimes(4)
      expect(copyQueue.getNumCopied()).toBe(0)

      vi.useRealTimers()
    })

    it('should use correct exponential backoff delays', async () => {
      vi.useFakeTimers()
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      const delays: Array<number> = []
      let lastTime = Date.now()

      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        const currentTime = Date.now()
        if (lastTime !== currentTime) {
          delays.push(currentTime - lastTime)
        }
        lastTime = currentTime
        callback(new Error('Test error'))
      })

      copyQueue.processQueue()

      const promise = copyQueue.enqueue({
        oldPath: '/source/path/file.js',
        newPath: '/dest/node_modules/pkg/file.js',
        packageName: 'test-package',
      })

      // Catch the promise rejection to prevent unhandled rejection
      promise.catch(() => {})

      // First attempt (immediate)
      await vi.advanceTimersByTimeAsync(0)

      // Second attempt (500ms = 500 * 2^0)
      await vi.advanceTimersByTimeAsync(500)

      // Third attempt (1000ms = 500 * 2^1)
      await vi.advanceTimersByTimeAsync(1000)

      // Fourth attempt (2000ms = 500 * 2^2)
      await vi.advanceTimersByTimeAsync(2000)

      await expect(promise).rejects.toThrow()

      // Verify exponential backoff: 500ms, 1000ms, 2000ms
      expect(delays).toEqual([500, 1000, 2000])

      vi.useRealTimers()
    })
  })

  describe('counter management', () => {
    it('should increment counter on successful copy', async () => {
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(null)
      })

      copyQueue.processQueue()

      expect(copyQueue.getNumCopied()).toBe(0)

      await copyQueue.enqueue({
        oldPath: '/source/path/file.js',
        newPath: '/dest/node_modules/pkg/file.js',
        packageName: 'test-package',
      })

      expect(copyQueue.getNumCopied()).toBe(1)
    })

    it('should not increment counter on failed copy', async () => {
      vi.useFakeTimers()
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(new Error('Copy failed'))
      })

      copyQueue.processQueue()

      const promise = copyQueue.enqueue({
        oldPath: '/source/path/file.js',
        newPath: '/dest/node_modules/pkg/file.js',
        packageName: 'test-package',
      })

      // Catch the promise rejection to prevent unhandled rejection
      promise.catch(() => {})

      // Let all retry attempts complete
      await vi.advanceTimersByTimeAsync(4000)

      await expect(promise).rejects.toThrow()

      expect(copyQueue.getNumCopied()).toBe(0)

      vi.useRealTimers()
    })

    it('should reset counter', () => {
      copyQueue.resetCounter()
      expect(copyQueue.getNumCopied()).toBe(0)
    })

    it('should track counter across multiple successful copies', async () => {
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(null)
      })

      copyQueue.processQueue()

      await copyQueue.enqueue({
        oldPath: '/source/path/file1.js',
        newPath: '/dest/node_modules/pkg/file1.js',
        packageName: 'test-package',
      })

      expect(copyQueue.getNumCopied()).toBe(1)

      await copyQueue.enqueue({
        oldPath: '/source/path/file2.js',
        newPath: '/dest/node_modules/pkg/file2.js',
        packageName: 'test-package',
      })

      expect(copyQueue.getNumCopied()).toBe(2)

      await copyQueue.enqueue({
        oldPath: '/source/path/file3.js',
        newPath: '/dest/node_modules/pkg/file3.js',
        packageName: 'test-package',
      })

      expect(copyQueue.getNumCopied()).toBe(3)
    })
  })

  describe('processQueue', () => {
    it('should mark queue as ready', () => {
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(null)
      })

      // Queue an operation
      copyQueue.enqueue({
        oldPath: '/source/path/file.js',
        newPath: '/dest/node_modules/pkg/file.js',
        packageName: 'test-package',
      })

      expect(mockCopy).not.toHaveBeenCalled()

      // Process the queue
      copyQueue.processQueue()

      // Should execute immediately
      expect(mockCopy).toHaveBeenCalledTimes(1)
    })

    it('should clear the queue after processing', async () => {
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(null)
      })

      const promise1 = copyQueue.enqueue({
        oldPath: '/source/path/file1.js',
        newPath: '/dest/node_modules/pkg/file1.js',
        packageName: 'test-package',
      })

      const promise2 = copyQueue.enqueue({
        oldPath: '/source/path/file2.js',
        newPath: '/dest/node_modules/pkg/file2.js',
        packageName: 'test-package',
      })

      copyQueue.processQueue()

      await Promise.all([promise1, promise2])

      expect(mockCopy).toHaveBeenCalledTimes(2)
    })

    it('should be idempotent - calling multiple times should not cause issues', async () => {
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(null)
      })

      const promise = copyQueue.enqueue({
        oldPath: '/source/path/file.js',
        newPath: '/dest/node_modules/pkg/file.js',
        packageName: 'test-package',
      })

      copyQueue.processQueue()
      copyQueue.processQueue() // Call again
      copyQueue.processQueue() // And again

      await promise

      // Should only execute once
      expect(mockCopy).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('should reject promise on copy error', async () => {
      vi.useFakeTimers()
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      const testError = new Error('File system error')

      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(testError)
      })

      copyQueue.processQueue()

      const promise = copyQueue.enqueue({
        oldPath: '/source/path/file.js',
        newPath: '/dest/node_modules/pkg/file.js',
        packageName: 'test-package',
      })

      // Catch the promise rejection to prevent unhandled rejection
      promise.catch(() => {})

      // Let all retry attempts complete
      await vi.advanceTimersByTimeAsync(4000)

      await expect(promise).rejects.toThrow('File system error')

      vi.useRealTimers()
    })

    it('should handle multiple simultaneous errors', async () => {
      vi.useFakeTimers()
      const mockCopy = fs.copy as unknown as Mock<CopyFn>

      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(new Error('Error'))
      })

      copyQueue.processQueue()

      const promise1 = copyQueue.enqueue({
        oldPath: '/source/path/file1.js',
        newPath: '/dest/node_modules/pkg/file1.js',
        packageName: 'test-package',
      })

      const promise2 = copyQueue.enqueue({
        oldPath: '/source/path/file2.js',
        newPath: '/dest/node_modules/pkg/file2.js',
        packageName: 'test-package',
      })

      // Catch the promise rejections to prevent unhandled rejections
      promise1.catch(() => {})
      promise2.catch(() => {})

      // Let all retry attempts complete
      await vi.advanceTimersByTimeAsync(4000)

      await expect(promise1).rejects.toThrow('Error')
      await expect(promise2).rejects.toThrow('Error')

      vi.useRealTimers()
    })
  })

  describe('fs.copy integration', () => {
    it('should call fs.copy with correct arguments', async () => {
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(null)
      })

      copyQueue.processQueue()

      await copyQueue.enqueue({
        oldPath: '/source/path/file.js',
        newPath: '/dest/node_modules/pkg/file.js',
        packageName: 'test-package',
      })

      expect(mockCopy).toHaveBeenCalledWith(
        '/source/path/file.js',
        '/dest/node_modules/pkg/file.js',
        expect.any(Function),
      )
    })

    it('should handle different file paths correctly', async () => {
      const mockCopy = fs.copy as unknown as Mock<CopyFn>
      mockCopy.mockImplementation((_oldPath: string, _newPath: string, callback: (err: Error | null) => void) => {
        callback(null)
      })

      copyQueue.processQueue()

      await copyQueue.enqueue({
        oldPath: '/source/path/deeply/nested/file.ts',
        newPath: '/dest/node_modules/@scope/package/deeply/nested/file.ts',
        packageName: '@scope/package',
      })

      expect(mockCopy).toHaveBeenCalledWith(
        '/source/path/deeply/nested/file.ts',
        '/dest/node_modules/@scope/package/deeply/nested/file.ts',
        expect.any(Function),
      )
    })
  })
})
