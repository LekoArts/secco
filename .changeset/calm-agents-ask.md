---
"secco": patch
---

Improve the CLI for scripts, CI, and AI agents:

- `secco init` without a terminal (CI, scripts, agents) now fails with the exact `secco init --source <ABSOLUTE_PATH> --yes` command to run. Previously it showed a prompt nobody could answer and exited successfully without creating `.seccorc`.
- A mistyped command like `secco instal` now fails with an error instead of silently running the default `secco` command.
- `--help` now shows `secco` instead of `cli.mjs`, lists the supported environment variables, links to the docs, and accepts `-h`. `-v` prints the version.
