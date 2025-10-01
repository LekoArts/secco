import fs from 'fs-extra'
import YAML from 'yaml'

function stripBom(string: string) {
  if (typeof string !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof string}`)
  }

  // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
  // conversion translates it to FEFF (UTF-16 BOM).
  if (string.charCodeAt(0) === 0xFEFF) {
    return string.slice(1)
  }

  return string
}

export function readYamlFile<T = unknown>(filepath: string) {
  const data = fs.readFileSync(filepath, 'utf8')

  return YAML.parse(stripBom(data)) as T
}
