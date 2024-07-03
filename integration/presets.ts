import { applicationConfig } from './models/application-config'
import { fixtures } from './fixtures'

const kitchenSink = applicationConfig()
  .setName('kitchen-sink')
  .setTemplate(fixtures['kitchen-sink'])

export const presets = {
  kitchenSink,
} as const
