# Secco Development Guide

## Build/Test Commands
- `pnpm build` - Build the project
- `pnpm test:unit` - Run unit tests
- `pnpm test:unit:w` - Watch mode for unit tests
- `pnpm test:integration` - Run integration tests
- `pnpm test:unit -- path/to/test.ts` - Run a single test file
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - TypeScript type checking

## Code Style
- **Imports**: Use `type` imports for types, Node.js imports with `node:` prefix
- **Formatting**: 2 spaces, single quotes, no semicolons (@antfu/eslint-config)
- **Arrays**: Use generic syntax `Array<T>` instead of `T[]`
- **Objects**: Use `Record<string, unknown>` instead of `{}` or `object`
- **Exports**: Named exports preferred, organize by type/function/const
- **Async**: Use async/await, handle errors with try-catch
- **Logging**: Use `logger` from `utils/logger.ts`, avoid console.log
- **Tests**: Use Vitest with describe/it blocks, place in `__tests__` folders
- **TypeScript**: Strict mode enabled, use explicit types for parameters
- **File structure**: Group related utilities in `utils/`, commands in `commands/`
