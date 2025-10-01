/**
 * Performs a deep comparison between two values to determine if they are equivalent.
 *
 * @example
 * isEqual({ a: 1 }, { a: 1 }) // true
 * isEqual([1, 2, 3], [1, 2, 3]) // true
 * isEqual({ a: { b: 2 } }, { a: { b: 2 } }) // true
 */
export function isEqual(value: unknown, other: unknown): boolean {
  if (value === other)
    return true

  if (value == null || other == null)
    return value === other

  if (typeof value !== typeof other)
    return false

  if (typeof value !== 'object')
    return value === other

  const valueIsArray = Array.isArray(value)
  const otherIsArray = Array.isArray(other)

  if (valueIsArray !== otherIsArray)
    return false

  if (valueIsArray && otherIsArray) {
    if (value.length !== other.length)
      return false

    return value.every((val, idx) => isEqual(val, other[idx]))
  }

  const valueKeys = Object.keys(value as Record<string, unknown>)
  const otherKeys = Object.keys(other as Record<string, unknown>)

  if (valueKeys.length !== otherKeys.length)
    return false

  return valueKeys.every(key =>
    otherKeys.includes(key)
    && isEqual(
      (value as Record<string, unknown>)[key],
      (other as Record<string, unknown>)[key],
    ),
  )
}

/**
 * Checks if value is an object (including functions but excluding null).
 *
 * @example
 * isObject({}) // true
 * isObject([1, 2, 3]) // true
 * isObject(() => {}) // true
 * isObject(null) // false
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  const type = typeof value
  return value != null && (type === 'object' || type === 'function')
}

/**
 * Transforms an object by iterating over its own properties and invoking an iteratee function.
 *
 * @example
 * transform({ a: 1, b: 2 }, (result, value, key) => {
 *   result[key] = value * 2
 * }, {}) // { a: 2, b: 4 }
 */
export function transform<T extends Record<string, any>, R extends Record<string, any>>(
  object: T,
  iteratee: (result: R, value: any, key: string) => void,
  accumulator?: R,
): R {
  const result = (accumulator ?? {}) as R

  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key))
      iteratee(result, object[key], key)
  }

  return result
}

/**
 * Creates a duplicate-free version of an array.
 *
 * @example
 * uniq([1, 2, 1, 3, 2]) // [1, 2, 3]
 */
export function uniq<T>(array: Array<T>): Array<T> {
  return [...new Set(array)]
}

/**
 * Creates an array of unique values that are included in all given arrays.
 *
 * @example
 * intersection([1, 2, 3], [2, 3, 4]) // [2, 3]
 * intersection([1, 2], [2, 3], [2, 4]) // [2]
 */
export function intersection<T>(...arrays: Array<Array<T>>): Array<T> {
  if (arrays.length === 0)
    return []

  if (arrays.length === 1)
    return [...arrays[0]]

  const [first, ...rest] = arrays
  const set = new Set(first)

  return first.filter(item =>
    rest.every(arr => arr.includes(item)) && set.has(item) && (set.delete(item) || true),
  )
}

/**
 * Recursively merges source objects into the target object. Nested objects are merged deeply.
 *
 * @example
 * merge({ a: 1 }, { b: 2 }) // { a: 1, b: 2 }
 * merge({ a: { x: 1 } }, { a: { y: 2 } }) // { a: { x: 1, y: 2 } }
 */
export function merge<T extends Record<string, any>>(
  target: T,
  ...sources: Array<Partial<T> | undefined>
): T {
  if (!sources.length)
    return target

  const result = { ...target }

  for (const source of sources) {
    if (!source)
      continue

    for (const key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key))
        continue

      const sourceValue = source[key]
      const targetValue = result[key]

      if (
        isObject(sourceValue)
        && !Array.isArray(sourceValue)
        && isObject(targetValue)
        && !Array.isArray(targetValue)
      ) {
        result[key] = merge(
          targetValue as Record<string, any>,
          sourceValue as Record<string, any>,
        ) as any
      }
      else {
        result[key] = sourceValue as any
      }
    }
  }

  return result
}

/**
 * Creates an array excluding all given values from the provided arrays.
 *
 * @example
 * difference([1, 2, 3], [2, 3, 4]) // [1]
 * difference([1, 2, 3, 4], [2], [4]) // [1, 3]
 */
export function difference<T>(array: Array<T>, ...values: Array<Array<T>>): Array<T> {
  const excludeSet = new Set(values.flat())
  return array.filter(item => !excludeSet.has(item))
}
