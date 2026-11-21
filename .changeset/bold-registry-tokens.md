---
"secco": major
---

Drop support for Node.js 22. secco now requires Node.js 24 or later, as its internal Verdaccio dependency was updated to v7 which doesn't support older versions.

Internal dependency updates: `verdaccio` to v7, `chokidar` to v6, and `del` to v9. Because Verdaccio 7 no longer accepts placeholder auth tokens, secco now creates a temporary user on its local registry and publishes with the token Verdaccio issues for it. No changes to your workflow are required.

If your source or package already has an `.npmrc`, secco now temporarily appends its token to that file and restores the original afterwards. Previously it used `npm config set`, which wrote to your global `~/.npmrc`.
