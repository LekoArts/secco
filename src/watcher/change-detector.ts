import { relative } from 'pathe'

/**
 * Helper functions for detecting and filtering file changes
 */

/**
 * Check if a file should be included based on the package.json 'files' field patterns
 *
 * @param relativeFilePath - Path relative to package root (e.g., "dist/index.js")
 * @param filesPatterns - Array of patterns from package.json 'files' field
 * @returns true if the file should be included
 */
export function shouldIncludeFile(
  relativeFilePath: string,
  filesPatterns: Array<string> | undefined,
): boolean {
  // If no files patterns, include everything
  if (!filesPatterns || filesPatterns.length === 0) {
    return true
  }

  // Always include package.json
  if (relativeFilePath === 'package.json') {
    return true
  }

  return filesPatterns.some((pattern) => {
    // Handle exact matches
    if (relativeFilePath === pattern) {
      return true
    }

    // Normalize pattern (remove trailing slash)
    const normalizedPattern = pattern.endsWith('/') ? pattern.slice(0, -1) : pattern

    // Handle directory patterns (e.g., "dist/" matches "dist/index.js")
    if (relativeFilePath.startsWith(`${normalizedPattern}/`)) {
      return true
    }

    // Handle glob patterns with wildcards (e.g., "*.js" or "dist/*.js")
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      return regex.test(relativeFilePath)
    }

    return false
  })
}

/**
 * Find which package a file belongs to by matching against package paths
 *
 * Uses relative path calculation to determine if a file is within a package directory.
 * A file is considered to belong to a package if its relative path from the package
 * directory doesn't start with '..' (meaning it's not outside the package).
 *
 * @param file - Absolute file path
 * @param packageEntries - Map entries of [packageName, packagePath]
 * @returns Object with packageName and packagePath, or null if not found
 *
 * @example
 * ```typescript
 * const entries = [
 *   ['my-package', '/source/packages/my-package'],
 *   ['other-package', '/source/packages/other-package']
 * ]
 * const result = findPackageForFile('/source/packages/my-package/index.js', entries)
 * // Returns: { packageName: 'my-package', packagePath: '/source/packages/my-package' }
 * ```
 */
export function findPackageForFile(
  file: string,
  packageEntries: Array<[string, string]>,
): { packageName: string, packagePath: string } | null {
  for (const [packageName, packagePath] of packageEntries) {
    const relativePath = relative(packagePath, file)

    // If relativePath doesn't start with '..', the file is within this package
    // Examples:
    //   'index.js' -> within package
    //   'src/utils/helper.js' -> within package
    //   '../other-package/file.js' -> outside package (starts with '..')
    if (!relativePath.startsWith('..')) {
      return { packageName, packagePath }
    }
  }

  return null
}
