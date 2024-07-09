/* eslint-disable node/prefer-global/process */
import { cp, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import fs from 'fs-extra'
import { basename, join } from 'pathe'
import { execaSync } from 'execa'
import { CONFIG_FILE_NAME } from '../../src/constants'
import { createLogger } from '../helpers/logger'
import { packageManager as rootPackageManager } from '../../package.json'
import { isTruthy } from '../../src/utils/is-truthy'
import { application } from './application'

export type ApplicationConfig = ReturnType<typeof applicationConfig>

type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun'

export function applicationConfig() {
  let name = ''
  let template = ''
  let packageManager: `${PackageManagerName}@${string}` = rootPackageManager as `pnpm@${string}`
  const logger = createLogger({ prefix: 'appConfig', color: 'yellow' })

  const self = {
    setName: (_name: string) => {
      name = _name
      return self
    },
    setTemplate: (_template: string) => {
      template = _template
      return self
    },
    get name() {
      return name
    },
    get packageManager() {
      return packageManager
    },
    clone: () => {
      const clone = applicationConfig()
      clone.setName(name)
      clone.setTemplate(template)

      return clone
    },
    setPackageManager: (name?: PackageManagerName, version?: string) => {
      if (name && version) {
        packageManager = `${name}@${version}`
      }
      return self
    },
    commit: async () => {
      logger.log(`Creating application "${name}"`)

      const isolatedDir = await mkdtemp(join(tmpdir(), `secco-${name}-`))

      if (isTruthy(process.env.CI) && isTruthy(process.env.GITHUB_ACTIONS)) {
        // Make isolatedDir available to other GitHub Actions steps
        logger.log('Setting INTEGRATION_ISOLATED_DIR environment variable')
        execaSync(`echo "INTEGRATION_ISOLATED_DIR=${isolatedDir}" >> $GITHUB_ENV`)
      }

      logger.log(`Copying template "${basename(template)}" to "${isolatedDir}"`)
      await cp(template, isolatedDir, { recursive: true })

      logger.log('Creating .seccorc file')
      await writeFile(join(isolatedDir, 'destination', CONFIG_FILE_NAME), `source.path="${join(isolatedDir, 'source')}"`, { encoding: 'utf-8' })

      logger.log(`Setting package manager to "${packageManager}" in destination`)
      const pkgJsonPath = join(isolatedDir, 'destination', 'package.json')
      const contents = await fs.readJSON(pkgJsonPath)
      contents.packageManager = packageManager
      await fs.writeJSON(pkgJsonPath, contents, { spaces: 2 })

      return application(self, isolatedDir)
    },
  }

  return self
}
