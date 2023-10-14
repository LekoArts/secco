import process from 'node:process'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'Unit tests',
    include: ['src/**/__tests__/*.ts'],
    globals: true,
    reporters: [process.env.CI ? 'default' : 'verbose'],
  },
})
