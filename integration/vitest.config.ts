import process from 'node:process'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'Integration tests',
    include: ['integration/__tests__/**/*.ts'],
    globals: true,
    reporters: [process.env.CI ? 'default' : 'verbose'],
    testTimeout: 120_000, // 120 seconds
  },
})
