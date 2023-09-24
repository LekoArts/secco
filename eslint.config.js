import antfu from '@antfu/eslint-config'

export default antfu({
  stylistic: true,
  typescript: true,
  jsonc: true,
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
        },
      },
    ],
    'ts/array-type': ['error', { default: 'generic' }],
  },
})
