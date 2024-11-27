import fs from 'fs-extra'
import yaml from 'js-yaml'
import stripBom from 'strip-bom'

export function readYamlFile<T = unknown>(filepath: string) {
  const data = fs.readFileSync(filepath, 'utf8')

  return yaml.load(stripBom(data)) as T
}
