import antfu from '@antfu/eslint-config'
import vitest from 'eslint-plugin-vitest'

export default antfu(
  {
    stylistic: true,
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
          },
        },
      ],
      'ts/array-type': ['error', { default: 'generic' }],
    },
  },
  {
    files: ['src/**/__tests__/*.ts'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },
)
