import { resolve } from 'pathe'

/**
 * Any fixture added to this record needs to be in the following folder format:
 * - destination
 * - source
 */
export const fixtures = {
  'kitchen-sink': resolve(__dirname, 'kitchen-sink'),
  'kitchen-sink-workspaces': resolve(__dirname, 'kitchen-sink-workspaces'),
  'pnpm-workspaces': resolve(__dirname, 'pnpm-workspaces'),
} as const

export type Fixture = keyof typeof fixtures
