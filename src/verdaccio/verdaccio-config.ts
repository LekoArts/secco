import os from 'node:os'
import { join } from 'pathe'
import type { Config } from '@verdaccio/types'
import { CLI_NAME } from '../constants'

// @ts-expect-error: Verdaccio's types are wrong
export const VERDACCIO_CONFIG: Config = {
  storage: join(os.tmpdir(), 'verdaccio', 'storage'),
  port: 4873, // Default
  max_body_size: '100mb',
  web: {
    enable: true,
    title: CLI_NAME,
  },
  self_path: './',
  logs: {
    type: 'stdout',
    format: 'pretty-timestamped',
    level: 'warn',
  },
  packages: {
    '**': {
      access: ['$all'],
      publish: ['$all'],
      proxy: ['npmjs'],
    },
  },
  uplinks: {
    npmjs: {
      url: 'https://registry.npmjs.org/',
      // default is 2 max_fails - on flaky networks that cause a lot of failed installations
      max_fails: 10,
    },
  },
}

export const REGISTRY_URL = `http://localhost:${VERDACCIO_CONFIG.port}`
