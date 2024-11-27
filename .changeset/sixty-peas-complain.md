---
"secco": minor
---

Add support for pnpm's [`workspace:` protocol](https://pnpm.io/workspaces) and [`catalog:`](https://pnpm.io/catalogs) features inside the source directory.

For example, if the package you want to test out has some of its dependencies defined like this:

```json
{
  "name": "source",
  "dependencies": {
    "internal-dep": "workspace:*",
    "react": "catalog:react"
  }
}
```

The `workspace:*` will be transformed to `latest` before publishing (if the dependency isn't being published with secco) and the `catalog:` entries are resolved using the `pnpm-workspace.yaml` file.
