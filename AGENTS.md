# secco

CLI that copies a local package's source into another project's `node_modules`, so you can test unpublished changes. Example: secco keeps a destination app in sync with edits to a library. When the destination uses workspaces, the package isn't installed yet, or its dependencies changed, it publishes to a temporary local Verdaccio registry and installs from that instead of copying files.

- `src/` is the CLI (`cli.ts` is the entry point). It is built with tsdown to `dist/cli.mjs`.
- `src/watcher.ts` runs the watch/copy loop. `src/verdaccio/` handles the local registry and publishing.
- `integration/` has end-to-end tests that run the built CLI against fixture projects using real package managers.
- `docs/` is the Astro/Starlight docs site. It is a separate pnpm project with its own lockfile.

## Build and verify

pnpm only (version pinned in `package.json` `packageManager`), Node >=24.

- `pnpm build`, `pnpm typecheck`, `pnpm lint` (`pnpm lint:fix` auto-fixes formatting), `pnpm test:unit`
- `pnpm test:integration` runs `dist/cli.mjs`, so run `pnpm build` first or it tests stale code.
  - Choose the package manager with `INTEGRATION_PM_NAME` and `INTEGRATION_PM_VERSION`. CI runs npm, pnpm 11/12, yarn classic/berry, and bun (see `.github/workflows/integration-testing.yml`).
  - Set `CI=true` to match CI log output. Without it, logger formatting differs and some assertions fail.
- Docs: `pnpm --dir docs install && pnpm --dir docs build`

## Conventions that tooling doesn't enforce

- User-facing changes need a changeset (`pnpm changeset`). Leave existing pending changesets alone. The Changesets release PR owns versioning and `CHANGELOG.md`.
