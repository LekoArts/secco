import { describe, expect, it } from 'vitest'
import { difference, intersection, isEqual, isObject, merge, transform, uniq } from '../underscore'

describe('isEqual', () => {
  it('should return true for identical primitive values', () => {
    expect(isEqual(1, 1)).toBe(true)
    expect(isEqual('foo', 'foo')).toBe(true)
    expect(isEqual(true, true)).toBe(true)
    expect(isEqual(null, null)).toBe(true)
    expect(isEqual(undefined, undefined)).toBe(true)
  })

  it('should return false for different primitive values', () => {
    expect(isEqual(1, 2)).toBe(false)
    expect(isEqual('foo', 'bar')).toBe(false)
    expect(isEqual(true, false)).toBe(false)
    expect(isEqual(null, undefined)).toBe(false)
  })

  it('should return true for equal objects', () => {
    expect(isEqual({ a: 1 }, { a: 1 })).toBe(true)
    expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
  })

  it('should return false for different objects', () => {
    expect(isEqual({ a: 1 }, { a: 2 })).toBe(false)
    expect(isEqual({ a: 1 }, { b: 1 })).toBe(false)
    expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })

  it('should return true for deeply nested equal objects', () => {
    expect(isEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBe(true)
    expect(isEqual({ a: { b: 2 } }, { a: { b: 2 } })).toBe(true)
  })

  it('should return false for deeply nested different objects', () => {
    expect(isEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } })).toBe(false)
  })

  it('should return true for equal arrays', () => {
    expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(isEqual(['a', 'b'], ['a', 'b'])).toBe(true)
  })

  it('should return false for different arrays', () => {
    expect(isEqual([1, 2, 3], [1, 2, 4])).toBe(false)
    expect(isEqual([1, 2], [1, 2, 3])).toBe(false)
    expect(isEqual(['a'], ['b'])).toBe(false)
  })

  it('should return true for nested arrays with equal values', () => {
    expect(isEqual([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(true)
  })

  it('should return false for nested arrays with different values', () => {
    expect(isEqual([[1, 2], [3, 4]], [[1, 2], [3, 5]])).toBe(false)
  })

  it('should handle mixed object and array structures', () => {
    expect(isEqual({ a: [1, 2], b: { c: 3 } }, { a: [1, 2], b: { c: 3 } })).toBe(true)
    expect(isEqual({ a: [1, 2], b: { c: 3 } }, { a: [1, 3], b: { c: 3 } })).toBe(false)
  })

  it('should return false when comparing object to array', () => {
    expect(isEqual({}, [])).toBe(false)
    expect(isEqual({ 0: 1, 1: 2 }, [1, 2])).toBe(false)
  })

  it('should handle null and undefined', () => {
    expect(isEqual(null, null)).toBe(true)
    expect(isEqual(undefined, undefined)).toBe(true)
    expect(isEqual(null, undefined)).toBe(false)
    expect(isEqual(null, {})).toBe(false)
    expect(isEqual(undefined, {})).toBe(false)
  })
})

describe('isObject', () => {
  it('should return true for plain objects', () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ a: 1 })).toBe(true)
  })

  it('should return true for arrays', () => {
    expect(isObject([])).toBe(true)
    expect(isObject([1, 2, 3])).toBe(true)
  })

  it('should return true for functions', () => {
    expect(isObject(() => {})).toBe(true)
    expect(isObject(() => {})).toBe(true)
  })

  it('should return false for null', () => {
    expect(isObject(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isObject(undefined)).toBe(false)
  })

  it('should return false for primitive values', () => {
    expect(isObject(1)).toBe(false)
    expect(isObject('string')).toBe(false)
    expect(isObject(true)).toBe(false)
  })
})

describe('transform', () => {
  it('should transform object properties', () => {
    const result = transform<{ a: number, b: number }, Record<string, number>>({ a: 1, b: 2 }, (acc, value, key) => {
      acc[key] = value * 2
    }, {})
    expect(result).toEqual({ a: 2, b: 4 })
  })

  it('should use empty object as default accumulator', () => {
    const result = transform<{ a: number, b: number }, Record<string, number>>({ a: 1, b: 2 }, (acc, value, key) => {
      acc[key] = value * 2
    })
    expect(result).toEqual({ a: 2, b: 4 })
  })

  it('should work with custom accumulator', () => {
    const result = transform<{ a: number, b: number }, { sum: number }>({ a: 1, b: 2 }, (acc, value) => {
      acc.sum = (acc.sum || 0) + value
    }, { sum: 0 })
    expect(result).toEqual({ sum: 3 })
  })

  it('should skip inherited properties', () => {
    const proto = { inherited: 1 }
    const obj = Object.create(proto)
    obj.own = 2

    const result = transform<any, Record<string, number>>(obj, (acc, value, key) => {
      acc[key] = value
    }, {})

    expect(result).toEqual({ own: 2 })
    expect(result).not.toHaveProperty('inherited')
  })

  it('should handle empty objects', () => {
    const result = transform<Record<string, never>, Record<string, number>>({}, (acc, value, key) => {
      acc[key] = value
    }, {})
    expect(result).toEqual({})
  })

  it('should allow filtering during transformation', () => {
    const result = transform<{ a: number, b: number, c: number }, Record<string, number>>({ a: 1, b: 2, c: 3 }, (acc, value, key) => {
      if (value > 1) {
        acc[key] = value
      }
    }, {})
    expect(result).toEqual({ b: 2, c: 3 })
  })
})

describe('uniq', () => {
  it('should remove duplicate values from array', () => {
    expect(uniq([1, 2, 1, 3, 2])).toEqual([1, 2, 3])
  })

  it('should handle arrays with no duplicates', () => {
    expect(uniq([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('should handle empty arrays', () => {
    expect(uniq([])).toEqual([])
  })

  it('should work with string arrays', () => {
    expect(uniq(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c'])
  })

  it('should handle arrays with all duplicates', () => {
    expect(uniq([1, 1, 1, 1])).toEqual([1])
  })

  it('should work with mixed types', () => {
    expect(uniq([1, '1', 2, '2', 1])).toEqual([1, '1', 2, '2'])
  })

  it('should preserve order of first occurrence', () => {
    expect(uniq([3, 1, 2, 3, 1])).toEqual([3, 1, 2])
  })
})

describe('intersection', () => {
  it('should return common elements from two arrays', () => {
    expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3])
  })

  it('should return common elements from multiple arrays', () => {
    expect(intersection([1, 2, 3], [2, 3, 4], [2, 5])).toEqual([2])
  })

  it('should return empty array when no common elements', () => {
    expect(intersection([1, 2], [3, 4])).toEqual([])
  })

  it('should return empty array for empty input', () => {
    expect(intersection()).toEqual([])
  })

  it('should return copy of single array', () => {
    expect(intersection([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('should handle duplicate values in input arrays', () => {
    expect(intersection([1, 1, 2, 2], [1, 2])).toEqual([1, 2])
  })

  it('should work with string arrays', () => {
    expect(intersection(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual(['b', 'c'])
  })

  it('should return empty array when one array is empty', () => {
    expect(intersection([1, 2, 3], [])).toEqual([])
    expect(intersection([], [1, 2, 3])).toEqual([])
  })

  it('should handle arrays with all same elements', () => {
    expect(intersection([1, 2, 3], [1, 2, 3])).toEqual([1, 2, 3])
  })
})

describe('merge', () => {
  it('should merge two objects', () => {
    const result: Record<string, any> = merge({ a: 1 } as any, { b: 2 } as any)
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('should merge multiple objects', () => {
    const result: Record<string, any> = merge({ a: 1 } as any, { b: 2 } as any, { c: 3 } as any)
    expect(result).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('should overwrite properties from left to right', () => {
    expect(merge({ a: 1 }, { a: 2 })).toEqual({ a: 2 })
  })

  it('should deeply merge nested objects', () => {
    const result: Record<string, any> = merge({ a: { x: 1 } } as any, { a: { y: 2 } } as any)
    expect(result).toEqual({ a: { x: 1, y: 2 } })
  })

  it('should deeply merge multiple levels', () => {
    const result: Record<string, any> = merge(
      { a: { b: { c: 1 } } } as any,
      { a: { b: { d: 2 } } } as any,
    )
    expect(result).toEqual({ a: { b: { c: 1, d: 2 } } })
  })

  it('should overwrite non-object values', () => {
    const result1: Record<string, any> = merge({ a: 1 } as any, { a: { b: 2 } } as any)
    expect(result1).toEqual({ a: { b: 2 } })
    const result2: Record<string, any> = merge({ a: { b: 2 } } as any, { a: 1 } as any)
    expect(result2).toEqual({ a: 1 })
  })

  it('should not merge arrays deeply', () => {
    expect(merge({ a: [1, 2] }, { a: [3, 4] })).toEqual({ a: [3, 4] })
  })

  it('should handle undefined sources', () => {
    const result: Record<string, any> = merge({ a: 1 } as any, undefined, { b: 2 } as any)
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('should return target when no sources provided', () => {
    expect(merge({ a: 1 })).toEqual({ a: 1 })
  })

  it('should handle empty objects', () => {
    const result1: Record<string, any> = merge({} as any, { a: 1 } as any)
    expect(result1).toEqual({ a: 1 })
    expect(merge({ a: 1 }, {})).toEqual({ a: 1 })
  })

  it('should merge complex nested structures', () => {
    const result: Record<string, any> = merge(
      { a: { b: 1, c: { d: 2 } } } as any,
      { a: { c: { e: 3 }, f: 4 } } as any,
    )
    expect(result).toEqual({ a: { b: 1, c: { d: 2, e: 3 }, f: 4 } })
  })

  it('should skip inherited properties in source', () => {
    const proto = { inherited: 1 }
    const source = Object.create(proto)
    source.own = 2

    const result: Record<string, any> = merge({ a: 1 } as any, source)
    expect(result).toEqual({ a: 1, own: 2 })
    expect(result).not.toHaveProperty('inherited')
  })
})

describe('difference', () => {
  it('should return values not in other arrays', () => {
    expect(difference([1, 2, 3], [2, 3, 4])).toEqual([1])
  })

  it('should handle multiple arrays to exclude', () => {
    expect(difference([1, 2, 3, 4], [2], [4])).toEqual([1, 3])
  })

  it('should return empty array when all values excluded', () => {
    expect(difference([1, 2, 3], [1, 2, 3])).toEqual([])
  })

  it('should return original array when no exclusions', () => {
    expect(difference([1, 2, 3], [])).toEqual([1, 2, 3])
  })

  it('should handle no exclusion arrays', () => {
    expect(difference([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('should work with string arrays', () => {
    expect(difference(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual(['a'])
  })

  it('should handle duplicates in source array', () => {
    expect(difference([1, 1, 2, 2, 3], [2])).toEqual([1, 1, 3])
  })

  it('should handle empty source array', () => {
    expect(difference([], [1, 2, 3])).toEqual([])
  })

  it('should handle multiple exclusion arrays with overlaps', () => {
    expect(difference([1, 2, 3, 4, 5], [2, 3], [3, 4])).toEqual([1, 5])
  })
})
