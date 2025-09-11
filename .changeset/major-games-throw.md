---
"secco": patch
---

Minor bug fixes here and there to improve the usability.

- Reuse already started Verdaccio server when trying to start a new one. Sometimes `secco` tried to start two servers and threw an error.
- Use `--legacy-peer-deps` for `npm install`. This helps when your source packages have incorrect peer dependencies.
- Correctly set `process.exit(0)` and `process.exit(1)` inside secco's codebase.
