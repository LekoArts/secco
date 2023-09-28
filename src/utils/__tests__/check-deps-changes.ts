import { difference } from '../check-deps-changes'

describe('difference', () => {
  it('should return the diff between two objects', () => {
    const result = difference(
      { a: 1, b: 2, c: 3 },
      { a: 1, b: 2, c: 4 },
    )

    expect(result).toEqual({ c: 3 })
  })
  it('should return the diff between two objects with nested objects', () => {
    const result = difference(
      { a: 1, b: 2, c: { d: 3, e: 4 } },
      { a: 1, b: 2, c: { d: 3, e: 5 } },
    )

    expect(result).toEqual({ c: { e: 4 } })
  })
})

describe.todo('checkDepsChanges')
