# Architectural Weaknesses & Improvement Opportunities

## 1. Critical Issues

### 1.1 Missing File Copying for Destination Workspaces
**Location:** `src/watcher.ts:49-54`  
**Severity:** ⚠️ High

```typescript
// Current logic forces Verdaccio for destination workspaces
if (destinationHasWorkspaces && !forceVerdaccio) {
  forceVerdaccio = true
  logger.info('Workspaces detected in destination. Automatically enabling `--force-verdaccio` flag.')
}
```

**Problem:**
- File copying doesn't work when destination has workspaces
- Forces slower Verdaccio publishing
- Marked as TODO (line 50): "Implement file copying logic for workspaces in destination"

**Impact:**
- Performance degradation for workspace destinations
- Inconsistent behavior between workspace and non-workspace destinations

**Recommendation:**
```typescript
// Proposed solution
function getDestinationNodeModulesPath(packageName: string, workspace: Workspace) {
  // Navigate to workspace root and find node_modules location
  // Handle hoisted dependencies vs. workspace-specific node_modules
  return join(workspace.location, 'node_modules', packageName)
}
```

---

### 1.2 Runtime Dependency Change Detection Not Supported
**Location:** `src/utils/check-deps-changes.ts:298-300`  
**Severity:** ⚠️ Medium

```typescript
// TODO(feature): Handle case where dependency change happens during 'watch' mode.
// secco currently doesn't handle this case. 
// It will only pick those changes up during its initial scan.
```

**Problem:**
- Adding/removing dependencies in watch mode requires restart
- No hot-reloading of package.json dependency changes

**Impact:**
- Developer friction - must restart secco when modifying dependencies
- Inconsistent with the "live development" promise

**Recommendation:**
```typescript
// Watch package.json for dependency changes in watch mode
chokidar.watch(sourcePackageJsonPaths)
  .on('change', async (file) => {
    const newDeps = await analyzePackageJsonChanges(file)
    if (newDeps.added.length > 0 || newDeps.removed.length > 0) {
      await handleDependencyChanges(newDeps)
    }
  })
```

---

### 1.3 No Executable File Permission Handling
**Location:** `src/watcher.ts:78`  
**Severity:** ⚠️ Medium

```typescript
// TODO(feature): Handle case where copied file needs to be executable. 
// Use fs.chmodSync(newPath, '0755') for that.
```

**Problem:**
- Binary files and executable scripts lose execute permissions
- Breaks packages with bin scripts

**Impact:**
- CLI tools won't work when copied
- Packages with binaries may fail

**Recommendation:**
```typescript
async function copyWithPermissions(oldPath: string, newPath: string) {
  await fs.copy(oldPath, newPath)
  
  const stats = await fs.stat(oldPath)
  const isExecutable = (stats.mode & 0o111) !== 0
  
  if (isExecutable) {
    await fs.chmod(newPath, stats.mode)
  }
}
```

---

## 2. Design & Architecture Issues

### 2.1 Large Watcher Module (368 lines)
**Location:** `src/watcher.ts`  
**Severity:** ⚠️ Medium

**Problem:**
- Single file handles: file watching, copying, publishing orchestration, dependency changes
- Violates Single Responsibility Principle
- Difficult to test individual behaviors

**Recommendation:**
Break into smaller modules:
```
src/watcher/
  ├── index.ts              # Main orchestrator
  ├── file-copier.ts        # File copying logic
  ├── change-detector.ts    # Detect changes
  ├── copy-queue.ts         # Queue management
  └── publisher.ts          # Publishing orchestration
```

---

### 2.2 Global State in initial-setup.ts
**Location:** `src/utils/initial-setup.ts:52-53`  
**Severity:** ⚠️ Low-Medium

```typescript
const packageNameToFilePath = new Map<string, string>()
const absolutePathsForDestinationPackages = new Set<string>()
```

**Problem:**
- Module-level mutable state
- Makes testing harder (need to reset state between tests)
- Not obvious that `getPackages()` has side effects

**Recommendation:**
```typescript
// Return state instead of mutating global
export function getPackages(sourcePath, workspaces) {
  const packageNameToFilePath = new Map<string, string>()
  // ... populate map
  return {
    packages: monorepoPackages,
    packageNameToFilePath,
  }
}
```

---

### 2.3 No Type for WatchEvents
**Location:** `src/constants.ts:2`  
**Severity:** ⚠️ Low

```typescript
export const WATCH_EVENTS = ['change', 'add'] as const
```

**Problem:**
- Not exported as a type
- Used with `includes()` instead of type guard

**Recommendation:**
```typescript
export const WATCH_EVENTS = ['change', 'add'] as const
export type WatchEvent = typeof WATCH_EVENTS[number]

// Usage
function isWatchEvent(event: string): event is WatchEvent {
  return WATCH_EVENTS.includes(event as WatchEvent)
}
```

---

## 3. Error Handling & Resilience

### 3.1 Silent Failure in traversePkgDeps
**Location:** `src/utils/traverse-pkg-deps.ts:26-36`  
**Severity:** ⚠️ Medium

```typescript
try {
  const pkgRoot = packageNamesToFilePath.get(p)
  if (pkgRoot) {
    pkgJson = fs.readJsonSync(join(pkgRoot, 'package.json'))
  } else {
    logger.error(`"${p}" doesn't exist in source location`)
    seenPackages = seenPackages.filter(seenPkg => seenPkg !== p)
    return  // Silent return
  }
}
```

**Problem:**
- Silently continues after error
- User might not notice missing packages
- `return` statement exits function, might skip dependent packages

**Recommendation:**
```typescript
// Collect errors and report at the end
const errors: Array<string> = []

packages.forEach((p) => {
  try {
    // ... existing logic
  } catch (e) {
    errors.push(`Failed to process ${p}: ${e.message}`)
  }
})

if (errors.length > 0) {
  throw new Error(`Package traversal failed:\n${errors.join('\n')}`)
}
```

---

### 3.2 No Timeout for Verdaccio Startup
**Location:** `src/verdaccio/index.ts:61-68`  
**Severity:** ⚠️ Low

```typescript
new Promise<never>((_, reject) => {
  setTimeout(() => {
    if (!resolved) {
      resolved = true
      reject(new Error('[Verdaccio] TIMEOUT - Verdaccio didn\'t start within 10s'))
    }
  }, 10000)  // Hardcoded 10s
})
```

**Problem:**
- Hardcoded timeout might be too short for slow systems
- No configuration option

**Recommendation:**
```typescript
const VERDACCIO_TIMEOUT = Number.parseInt(
  process.env.SECCO_VERDACCIO_TIMEOUT || ''
) || 10000

// Allow override via environment variable
```

---

### 3.3 Uncaught Promise Rejections in Watcher
**Location:** `src/watcher.ts:357-365`  
**Severity:** ⚠️ Medium

```typescript
Promise.all(allCopies)
  .then(() => {
    if (scanOnce)
      quit()
  })
  .catch((err) => {
    logger.error('One or more file copies failed:', err)
  })
```

**Problem:**
- Logs error but continues execution
- Might leave destination in inconsistent state
- User doesn't know which files failed

**Recommendation:**
```typescript
Promise.allSettled(allCopies)
  .then((results) => {
    const failures = results.filter(r => r.status === 'rejected')
    if (failures.length > 0) {
      logger.error(`${failures.length} file copies failed:`)
      failures.forEach((f, i) => {
        logger.error(`  ${i + 1}. ${f.reason}`)
      })
      process.exit(1)
    }
    if (scanOnce) quit()
  })
```

---

## 4. Performance Issues

### 4.1 Inefficient Package Name Matching
**Location:** `src/watcher.ts:209-230`  
**Severity:** ⚠️ Low-Medium

```typescript
// O(n) lookup on every file change
for (const [_packageName, _packagePath] of pkgPathMatchingEntries) {
  const relativePath = relative(_packagePath, file)
  if (!relativePath.startsWith('..')) {
    packageName = _packageName
    packagePath = _packagePath
    break
  }
}
```

**Problem:**
- Linear search for every file change
- Performance degrades with many packages

**Recommendation:**
```typescript
// Build reverse lookup map once
const filePathToPackage = new Map<string, { name: string, path: string }>()

for (const [name, path] of packageNamesToFilePath) {
  filePathToPackage.set(path, { name, path })
}

// O(1) lookup
function findPackageForFile(filePath: string): { name: string, path: string } | null {
  let currentPath = filePath
  while (currentPath !== '/') {
    if (filePathToPackage.has(currentPath)) {
      return filePathToPackage.get(currentPath)!
    }
    currentPath = dirname(currentPath)
  }
  return null
}
```

---

### 4.2 Synchronous JSON Parsing
**Location:** Multiple locations (e.g., `src/utils/traverse-pkg-deps.ts:23`)  
**Severity:** ⚠️ Low

```typescript
pkgJson = fs.readJsonSync(join(pkgRoot, 'package.json'))
```

**Problem:**
- Blocks event loop
- Could impact watch mode responsiveness with many packages

**Recommendation:**
```typescript
// Use async version in non-critical paths
pkgJson = await fs.readJson(join(pkgRoot, 'package.json'))
```

---

## 5. Testing Gaps

### 5.1 No Unit Tests for Watcher
**Location:** `src/__tests__/watcher.ts` (only 1 basic test)  
**Severity:** ⚠️ High

**Problem:**
- Core watcher logic (368 lines) has minimal unit test coverage
- Most testing is integration-level only
- Hard to test edge cases

**Recommendation:**
- Extract testable functions from watcher
- Mock file system and chokidar
- Test copy queue, retry logic, dependency detection independently

---

### 5.2 Missing Error Scenario Tests
**Severity:** ⚠️ Medium

**Missing Tests:**
- Verdaccio fails to start
- File copy fails after max retries
- Package manager not detected
- Corrupted package.json files
- Network failures during unpkg.com fetch

**Recommendation:**
Add dedicated error scenario tests:
```typescript
describe('error scenarios', () => {
  it('should handle verdaccio startup failure gracefully', async () => {
    // Mock verdaccio to reject startup
    // Verify error message and exit code
  })
  
  it('should exit after max file copy retries', async () => {
    // Mock fs.copy to always fail
    // Verify retry count and error message
  })
})
```

---

## 6. Documentation & Developer Experience

### 6.1 No API Documentation
**Severity:** ⚠️ Low

**Problem:**
- No JSDoc comments on public functions
- Hard to understand function contracts without reading implementation

**Recommendation:**
Add JSDoc to public APIs:
```typescript
/**
 * Traverses package dependencies and builds a dependency tree.
 * 
 * @param packages - List of package names to traverse
 * @param sourcePackages - All available source packages
 * @param packageNamesToFilePath - Map of package names to file paths
 * @returns Object containing seen packages and dependency tree
 * 
 * @example
 * const { seenPackages, depTree } = traversePkgDeps({
 *   packages: ['my-package'],
 *   sourcePackages: ['my-package', 'dep-package'],
 *   packageNamesToFilePath: new Map([['my-package', '/path/to/pkg']])
 * })
 */
export function traversePkgDeps(args: TraversePackageDependenciesArgs) {
  // ...
}
```

---

### 6.2 No Architecture Documentation
**Severity:** ⚠️ Low

**Problem:**
- No docs explaining dual-strategy approach
- New contributors need to reverse-engineer the architecture

**Recommendation:**
- Add `ARCHITECTURE.md` explaining design decisions
- Document data flow diagrams
- Explain when Verdaccio vs file copying is used

---

## 7. Configuration & Extensibility

### 7.1 Hardcoded Ignored Patterns
**Location:** `src/constants.ts:3`  
**Severity:** ⚠️ Low

```typescript
export const DEFAULT_IGNORED: Array<RegExp> = [
  /[/\\]node_modules[/\\]/i, 
  /\.git/i, 
  /\.DS_Store/, 
  /[/\\]__tests__[/\\]/i,
  // ...
]
```

**Problem:**
- No way for users to customize ignored patterns
- Might want to include tests in some scenarios

**Recommendation:**
```typescript
// Add to .seccorc schema
interface Config {
  source: { path: string }
  ignore?: Array<string>  // Glob patterns
  watch?: {
    includeTests?: boolean
    includeSourceMaps?: boolean
  }
}
```

---

### 7.2 No Hook System
**Severity:** ⚠️ Low

**Problem:**
- No way to run custom scripts before/after operations
- Can't extend behavior without modifying source

**Recommendation:**
```typescript
interface Config {
  hooks?: {
    beforePublish?: string    // Shell command
    afterPublish?: string
    beforeCopy?: string
    afterInstall?: string
  }
}

// Usage
if (config.hooks?.beforePublish) {
  await execa('sh', ['-c', config.hooks.beforePublish])
}
```

---

## 8. Code Quality Issues

### 8.1 Magic Numbers
**Location:** Multiple locations  
**Severity:** ⚠️ Low

```typescript
// src/watcher.ts:20
const MAX_COPY_RETRIES = 3  // Good - named constant

// src/watcher.ts:72
500 * 2 ** retry  // Bad - magic number

// src/verdaccio/index.ts:66
10000  // Bad - magic timeout
```

**Recommendation:**
```typescript
const INITIAL_RETRY_DELAY_MS = 500
const RETRY_BACKOFF_MULTIPLIER = 2

setTimeout(
  () => _copyPath({ ...args, retry: retry + 1 }),
  INITIAL_RETRY_DELAY_MS * RETRY_BACKOFF_MULTIPLIER ** retry
)
```

---

### 8.2 Deprecated API Usage
**Location:** `src/utils/pnpm.ts:52`  
**Severity:** ⚠️ Low

```typescript
if (util.types.isNativeError(err) && 'code' in err && err.code === 'ENOENT') {
  // util.types.isNativeError is deprecated
}
```

**Recommendation:**
```typescript
function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err
}

if (isNodeError(err) && err.code === 'ENOENT') {
  return undefined
}
```

---

## Priority Matrix

| Issue | Severity | Impact | Effort | Priority |
|-------|----------|--------|--------|----------|
| Destination workspace file copying | High | High | High | P0 |
| Runtime dependency change detection | Medium | Medium | Medium | P1 |
| Watcher module size/complexity | Medium | Medium | Medium | P1 |
| Test coverage for watcher | High | Medium | High | P1 |
| Executable file permissions | Medium | Medium | Low | P2 |
| Error scenario tests | Medium | Low | Medium | P2 |
| Global state in initial-setup | Medium | Low | Low | P3 |
| Performance optimizations | Low | Low | Medium | P3 |
| Documentation improvements | Low | Low | Low | P3 |

---

## Recommendations Summary

### Immediate (P0)
1. **Implement file copying for destination workspaces** - This is a documented limitation

### Short-term (P1)
2. **Refactor watcher.ts** - Break into smaller modules
3. **Add runtime dependency change detection** - Improve DX
4. **Increase test coverage** - Especially for core watcher logic

### Medium-term (P2)
5. **Handle executable permissions** - Fix CLI packages
6. **Add error scenario tests** - Increase reliability
7. **Improve error handling** - Better user feedback

### Long-term (P3)
8. **Add API documentation** - JSDoc comments
9. **Performance optimizations** - Package lookup, async file operations
10. **Configuration extensibility** - Hooks, custom ignore patterns
