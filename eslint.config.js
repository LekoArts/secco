import antfu from '@antfu/eslint-config'

export default antfu(
  {
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },
    typescript: true,
    jsonc: true,
    ignores: ['dist', 'node_modules', 'pnpm-lock.yaml'],
  },
  {
    rules: {
      'no-console': 'warn',
      'ts/ban-types': [
        'error',
        {
          extendDefaults: true,
          types: {
            '{}': {
              fixWith: 'Record<string, unknown>',
            },
            'object': {
              fixWith: 'Record<string, unknown>',
            },
            'Function': false,
          },
        },
      ],
      'ts/array-type': ['error', { default: 'generic' }],
      'node/prefer-global/process': 'off',
    },
  },
)
