---
"secco": minor
---

You can now use secco inside destinations that are set up with [workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces). It should work for all supported package managers (npm, yarn, pnpm, bun).

Please note: secco will automatically use the `--force-verdaccio` flag when inside a workspaces project.
