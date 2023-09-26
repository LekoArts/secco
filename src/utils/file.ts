import { destr } from 'destr'
import fs from 'fs-extra'
import { join } from 'pathe'

export async function pathExists(p: string) {
  try {
    await fs.access(p)
    return true
  }
  catch {
    return false
  }
}

export interface PackageJson {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  workspaces?: Array<string> | { packages: Array<string> }
}

export function readPackageJSON(dir: string) {
  const file = join(dir, 'package.json')
  if (fs.existsSync(file))
    return destr<PackageJson>(fs.readFileSync(file, 'utf8'))

  return null
}
