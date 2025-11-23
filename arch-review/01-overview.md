# Secco - Architectural Overview

**Review Date:** November 23, 2025  
**Codebase Version:** 3.1.2  
**Total Source Files:** 28 files (~2,415 lines of code)

## Executive Summary

Secco is a sophisticated CLI tool for local package testing that elegantly solves the challenges of `npm link` by combining direct file copying with a local Verdaccio registry. The architecture demonstrates strong separation of concerns, excellent error handling, and thoughtful handling of complex monorepo scenarios.

## Project Purpose

Secco enables developers to test local package changes in destination projects without publishing to npm's remote registry, avoiding the pitfalls of symlinks and dependency resolution issues.

## Core Architecture

### 1. **Hybrid Dual-Strategy Approach**

Secco employs two complementary strategies:

- **File Copying (Default):** Direct file synchronization from source to destination's `node_modules`
- **Verdaccio Publishing (Fallback):** Local npm registry for complex dependency scenarios

**Decision Point (src/watcher.ts:46-54):**
```typescript
if (destinationHasWorkspaces && !forceVerdaccio) {
  forceVerdaccio = true
  logger.info('Workspaces detected in destination. Automatically enabling `--force-verdaccio` flag.')
}
```

### 2. **Component Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Layer                           │
│                      (cli.ts, main.ts)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┴────────────────────┐
        │                                        │
┌───────▼─────────┐                  ┌──────────▼──────────┐
│  Configuration  │                  │   File Watcher      │
│   Management    │                  │   (watcher.ts)      │
│  (utils/config) │                  │                     │
└─────────────────┘                  └──────────┬──────────┘
                                                │
                    ┌──────────────────────────┼──────────────────────┐
                    │                          │                      │
         ┌──────────▼────────┐     ┌──────────▼────────┐  ┌─────────▼─────────┐
         │  File Operations  │     │    Verdaccio      │  │   Dependency      │
         │   (copy, sync)    │     │   Management      │  │   Resolution      │
         │                   │     │  (verdaccio/)     │  │ (traverse-pkg-deps)│
         └───────────────────┘     └───────────────────┘  └───────────────────┘
```

### 3. **Key Design Patterns**

#### Observer Pattern
- Chokidar file watching for real-time source changes
- Event-driven architecture for file modifications

#### Strategy Pattern
- Dynamic switching between file copying and Verdaccio publishing
- Package manager abstraction (npm, yarn, pnpm, bun)

#### Factory Pattern
- Command generation for different package managers (add-dependencies.ts)
- Configuration schema validation (config.ts)

#### Cleanup Pattern
- Resource cleanup with `registerCleanupTask` and `onExit` hooks
- Graceful shutdown handling for Verdaccio server

## Technology Stack

### Core Dependencies
- **CLI Framework:** yargs (command-line parsing)
- **File Watching:** chokidar (cross-platform file watching)
- **Process Execution:** execa (subprocess management)
- **File System:** fs-extra (enhanced fs operations)
- **Validation:** valibot (schema validation)
- **Registry:** verdaccio (local npm registry)
- **Configuration:** rc9 (configuration management)

### Development Tools
- **Build:** tsdown (TypeScript bundler)
- **Testing:** Vitest (unit & integration tests)
- **Linting:** @antfu/eslint-config
- **Package Manager:** pnpm (workspaces)

## Architectural Strengths

### 1. **Separation of Concerns**
- Clean separation between CLI, business logic, and utilities
- Well-organized folder structure (`commands/`, `utils/`, `verdaccio/`)

### 2. **Error Handling**
- Comprehensive error handling with retries (file copying: 3 retries with exponential backoff)
- Graceful degradation (fallback to unpkg.com for missing packages)

### 3. **Package Manager Agnostic**
- Support for npm, yarn (classic & berry), pnpm, and bun
- Smart detection using `nypm` library

### 4. **Monorepo Support**
- Full workspace support for both source and destination
- Dependency tree traversal for transitive dependencies
- Special handling for pnpm workspaces (workspace: and catalog: protocols)

### 5. **State Management**
- Stateful watcher with queued operations
- Ignored package.json changes during publishing to avoid race conditions
- Cleanup task registration for reliable resource management

## Data Flow

### Initial Scan Flow
```
1. Load Configuration (.seccorc or ENV)
2. Detect Package Managers (source & destination)
3. Discover Workspaces (if present)
4. Build Package List (source packages)
5. Traverse Dependency Tree (find all transitive deps)
6. Initialize File Watcher
7. Perform Initial Scan
8. Detect Dependency Changes
9. Publish to Verdaccio (if needed) OR Queue File Copies
10. Install Dependencies
11. Execute Queued Copies
12. Enter Watch Mode (unless --scan-once)
```

### Watch Mode Flow
```
File Change Detected
    ↓
Filter by WATCH_EVENTS (change, add)
    ↓
Match Package Name from Path
    ↓
Check Files Patterns (package.json 'files' field)
    ↓
package.json change?
    ├─ Yes → Check Dependency Changes → Trigger Publish if needed
    └─ No → Queue File Copy
    ↓
Copy File with Retry Logic (max 3 retries)
```

## Configuration Architecture

### Schema Definition (src/utils/config.ts)
```typescript
ConfigSchema = strictObject({
  source: strictObject({
    path: sourcePathSchema('source.path'), // Must be absolute path
  })
})
```

### Configuration Sources (Priority Order)
1. Environment Variable: `SECCO_SOURCE_PATH`
2. Configuration File: `.seccorc` in current directory

### Validation
- Uses Valibot for schema validation
- Enforces absolute paths
- Provides detailed error messages

## Module Responsibilities

### Core Modules

| Module | Responsibility | Key Functions |
|--------|---------------|---------------|
| `cli.ts` | CLI entry point, command routing | yargs configuration |
| `main.ts` | Application initialization | Package detection, workspace discovery |
| `watcher.ts` | File watching & orchestration | File copying, change detection |
| `config.ts` | Configuration management | Load, validate, store config |

### Verdaccio Modules

| Module | Responsibility |
|--------|---------------|
| `index.ts` | Verdaccio lifecycle management |
| `publish-package.ts` | Package publishing to local registry |
| `install-packages.ts` | Install from local registry |
| `cleanup-tasks.ts` | Resource cleanup on exit |

### Utility Modules

| Module | Purpose |
|--------|---------|
| `initial-setup.ts` | Workspace discovery, package enumeration |
| `traverse-pkg-deps.ts` | Build dependency graph |
| `check-deps-changes.ts` | Detect dependency modifications |
| `adjust-package-json.ts` | Modify versions for publishing |
| `underscore.ts` | Functional utilities (zero lodash dependency) |

## References

- Main Entry: `src/cli.ts:1`
- Application Bootstrap: `src/main.ts:12`
- Core Watcher: `src/watcher.ts:41`
- Configuration: `src/utils/config.ts:94`
- Verdaccio Integration: `src/verdaccio/index.ts:110`
