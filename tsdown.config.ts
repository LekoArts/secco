import { defineConfig } from 'tsdown'

export default defineConfig((options) => {
  return {
    entry: ['src/cli.ts'],
    dts: false,
    sourcemap: !!options.watch,
    format: 'esm',
    minify: !options.watch,
    clean: true,
    outExtensions: () => ({
      js: '.mjs',
    }),
  }
})
