import { describe, expect, it } from 'vitest'
import { shouldIncludeFile } from '../change-detector'

describe('shouldIncludeFile', () => {
  describe('when no files patterns provided', () => {
    it('should include all files when filesPatterns is undefined', () => {
      expect(shouldIncludeFile('index.js', undefined)).toBe(true)
      expect(shouldIncludeFile('dist/index.js', undefined)).toBe(true)
      expect(shouldIncludeFile('package.json', undefined)).toBe(true)
    })

    it('should include all files when filesPatterns is empty array', () => {
      expect(shouldIncludeFile('index.js', [])).toBe(true)
      expect(shouldIncludeFile('dist/index.js', [])).toBe(true)
      expect(shouldIncludeFile('package.json', [])).toBe(true)
    })
  })

  describe('package.json handling', () => {
    it('should always include package.json regardless of patterns', () => {
      expect(shouldIncludeFile('package.json', ['dist'])).toBe(true)
      expect(shouldIncludeFile('package.json', ['src'])).toBe(true)
      expect(shouldIncludeFile('package.json', ['*.js'])).toBe(true)
      expect(shouldIncludeFile('package.json', ['completely-different'])).toBe(true)
    })
  })

  describe('exact match patterns', () => {
    it('should include files that exactly match a pattern', () => {
      expect(shouldIncludeFile('index.js', ['index.js'])).toBe(true)
      expect(shouldIncludeFile('README.md', ['README.md', 'index.js'])).toBe(true)
    })

    it('should exclude files that do not match any pattern', () => {
      expect(shouldIncludeFile('index.js', ['README.md'])).toBe(false)
      expect(shouldIncludeFile('test.js', ['index.js', 'main.js'])).toBe(false)
    })
  })

  describe('directory patterns', () => {
    it('should include files in a directory when pattern matches directory', () => {
      expect(shouldIncludeFile('dist/index.js', ['dist'])).toBe(true)
      expect(shouldIncludeFile('dist/utils/helper.js', ['dist'])).toBe(true)
      expect(shouldIncludeFile('src/main.ts', ['src'])).toBe(true)
    })

    it('should handle directory patterns with trailing slash', () => {
      expect(shouldIncludeFile('dist/index.js', ['dist/'])).toBe(true)
      expect(shouldIncludeFile('dist/utils/helper.js', ['dist/'])).toBe(true)
      expect(shouldIncludeFile('src/main.ts', ['src/'])).toBe(true)
    })

    it('should exclude files not in the directory', () => {
      expect(shouldIncludeFile('lib/index.js', ['dist'])).toBe(false)
      expect(shouldIncludeFile('src/main.ts', ['dist'])).toBe(false)
      expect(shouldIncludeFile('index.js', ['dist'])).toBe(false)
    })

    it('should not match partial directory names', () => {
      // "dist" should not match "distribution/index.js"
      expect(shouldIncludeFile('distribution/index.js', ['dist'])).toBe(false)
      // "src" should not match "src-backup/file.js"
      expect(shouldIncludeFile('src-backup/file.js', ['src'])).toBe(false)
    })
  })

  describe('wildcard patterns', () => {
    it('should match files with * wildcard', () => {
      expect(shouldIncludeFile('index.js', ['*.js'])).toBe(true)
      expect(shouldIncludeFile('main.ts', ['*.ts'])).toBe(true)
      expect(shouldIncludeFile('README.md', ['*.md'])).toBe(true)
    })

    it('should match files with directory and wildcard', () => {
      expect(shouldIncludeFile('dist/index.js', ['dist/*.js'])).toBe(true)
      expect(shouldIncludeFile('src/main.ts', ['src/*.ts'])).toBe(true)
    })

    it('should match nested files with ** pattern', () => {
      expect(shouldIncludeFile('dist/utils/helper.js', ['dist*'])).toBe(true)
      expect(shouldIncludeFile('src/components/Button.tsx', ['src*'])).toBe(true)
    })

    it('should exclude files that do not match wildcard pattern', () => {
      expect(shouldIncludeFile('index.ts', ['*.js'])).toBe(false)
      expect(shouldIncludeFile('lib/index.js', ['dist/*.js'])).toBe(false)
    })

    it('should handle multiple wildcards in pattern', () => {
      expect(shouldIncludeFile('test/unit/helper.test.js', ['*/*/*.js'])).toBe(true)
      expect(shouldIncludeFile('anything.test.js', ['*.test.*'])).toBe(true)
    })
  })

  describe('multiple patterns', () => {
    it('should include file if it matches any pattern', () => {
      const patterns = ['dist', 'lib', '*.md']

      expect(shouldIncludeFile('dist/index.js', patterns)).toBe(true)
      expect(shouldIncludeFile('lib/helper.js', patterns)).toBe(true)
      expect(shouldIncludeFile('README.md', patterns)).toBe(true)
    })

    it('should exclude file if it matches no patterns', () => {
      const patterns = ['dist', 'lib', '*.md']

      expect(shouldIncludeFile('src/index.js', patterns)).toBe(false)
      expect(shouldIncludeFile('test.ts', patterns)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle files in root directory', () => {
      expect(shouldIncludeFile('index.js', ['index.js'])).toBe(true)
      expect(shouldIncludeFile('index.js', ['*.js'])).toBe(true)
      expect(shouldIncludeFile('index.js', ['dist'])).toBe(false)
    })

    it('should handle deeply nested paths', () => {
      const patterns = ['dist']
      expect(shouldIncludeFile('dist/a/b/c/d/e/f.js', patterns)).toBe(true)
    })

    it('should handle paths with dots', () => {
      expect(shouldIncludeFile('.github/workflows/ci.yml', ['.github'])).toBe(true)
      expect(shouldIncludeFile('dist/.hidden', ['dist'])).toBe(true)
    })

    it('should handle paths with special characters', () => {
      expect(shouldIncludeFile('dist/@types/index.d.ts', ['dist'])).toBe(true)
      expect(shouldIncludeFile('src/@scope/package/index.js', ['src'])).toBe(true)
    })

    it('should be case-sensitive', () => {
      expect(shouldIncludeFile('Dist/index.js', ['dist'])).toBe(false)
      expect(shouldIncludeFile('INDEX.js', ['index.js'])).toBe(false)
    })
  })

  describe('real-world patterns', () => {
    it('should work with typical npm package patterns', () => {
      const patterns = ['dist', 'lib', '*.md', 'LICENSE']

      expect(shouldIncludeFile('dist/index.js', patterns)).toBe(true)
      expect(shouldIncludeFile('dist/types/main.d.ts', patterns)).toBe(true)
      expect(shouldIncludeFile('lib/helper.js', patterns)).toBe(true)
      expect(shouldIncludeFile('README.md', patterns)).toBe(true)
      expect(shouldIncludeFile('LICENSE', patterns)).toBe(true)
      expect(shouldIncludeFile('package.json', patterns)).toBe(true)

      expect(shouldIncludeFile('src/index.ts', patterns)).toBe(false)
      expect(shouldIncludeFile('test/helper.test.js', patterns)).toBe(false)
      expect(shouldIncludeFile('.eslintrc.js', patterns)).toBe(false)
    })

    it('should work with TypeScript package patterns', () => {
      const patterns = ['dist', '*.d.ts']

      expect(shouldIncludeFile('dist/index.js', patterns)).toBe(true)
      expect(shouldIncludeFile('dist/utils/helper.js', patterns)).toBe(true)
      expect(shouldIncludeFile('index.d.ts', patterns)).toBe(true)
      expect(shouldIncludeFile('types.d.ts', patterns)).toBe(true)

      expect(shouldIncludeFile('src/index.ts', patterns)).toBe(false)
    })

    it('should work with monorepo package patterns', () => {
      const patterns = ['dist/', 'README.md', 'CHANGELOG.md']

      expect(shouldIncludeFile('dist/index.js', patterns)).toBe(true)
      expect(shouldIncludeFile('README.md', patterns)).toBe(true)
      expect(shouldIncludeFile('CHANGELOG.md', patterns)).toBe(true)
      expect(shouldIncludeFile('package.json', patterns)).toBe(true)

      expect(shouldIncludeFile('src/main.ts', patterns)).toBe(false)
      expect(shouldIncludeFile('tsconfig.json', patterns)).toBe(false)
    })
  })
})
