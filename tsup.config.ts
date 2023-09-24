import { defineConfig } from 'tsup'

export default defineConfig((options) => {
  return {
    name: 'secco',
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
