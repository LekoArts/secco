import process from 'node:process'
import fs from 'fs-extra'
import { logger } from './logger'

const currentDir = process.cwd()

export function checkDirHasPackageJson() {
  const packageJsonPath = `${currentDir}/package.json`
  const hasFile = fs.existsSync(packageJsonPath)

  if (!hasFile) {
    logger.fatal(`No package.json found in ${currentDir}

Current directory must contain a package.json file.`)
    process.exit(1)
  }
}
