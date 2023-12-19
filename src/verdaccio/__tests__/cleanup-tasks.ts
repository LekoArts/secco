import { registerCleanupTask } from '../cleanup-tasks'

describe('registerCleanupTask', () => {
  it('should call the task function and return its result when the returned function is called', () => {
    const taskFn = vi.fn(() => 'result')
    const cleanupFn = registerCleanupTask(taskFn)

    const result = cleanupFn()

    expect(taskFn).toHaveBeenCalled()
    expect(result).toBe('result')
  })
})
