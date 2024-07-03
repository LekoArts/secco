/* eslint-disable ts/no-namespace */
/* eslint-disable node/prefer-global/process */
import { applicationConfig } from './models/application-config'
import { fixtures } from './fixtures'

const constants = {
  INTEGRATION_PM_NAME: process.env.INTEGRATION_PM_NAME,
  INTEGRATION_PM_VERSION: process.env.INTEGRATION_PM_VERSION,
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      INTEGRATION_PM_NAME?: 'npm' | 'pnpm' | 'yarn' | 'bun'
      INTEGRATION_PM_VERSION?: string
    }
  }
}

const kitchenSink = applicationConfig()
  .setName('kitchen-sink')
  .setTemplate(fixtures['kitchen-sink'])
  .setPackageManager(constants.INTEGRATION_PM_NAME, constants.INTEGRATION_PM_VERSION)

export const presets = {
  kitchenSink,
} as const
