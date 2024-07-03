import { resolve } from 'pathe'

/**
 * Any fixture added to this record needs to be in the following folder format:
 * - destination
 * - source
 */
export const fixtures = {
  'kitchen-sink': resolve(__dirname, 'kitchen-sink'),
} as const

export type Fixture = keyof typeof fixtures
