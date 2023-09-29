import { defineConfig } from 'tsup'
import { CLI_NAME } from './src/constants'

export default defineConfig((options) => {
  return {
    name: CLI_NAME,
    entry: ['src/cli.ts'],
    dts: false,
    sourcemap: !!options.watch,
    format: 'esm',
    minify: !options.watch,
    clean: true,
    outExtension() {
      return {
        js: '.mjs',
      }
    },
  }
})
