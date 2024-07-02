---
"secco": minor
---

Add full support for [Bun](https://bun.sh/) by correctly setting the npm registry during `bun add`. This is achieved by using the `BUN_CONFIG_REGISTRY` environment variable.
