---
"secco": patch
---

Adjust the default list of ignored files and directories to include lock files of popular package managers. Also a bug was fixed to now correctly exclude `src` when copying over changes from source to destination. Your logs (e.g. `Copied X to Y`) now **not** include any files inside `src`.

Also a small bug was fixed that occurred when using the `--force-verdaccio` flag. Previously, the process ended even without the `--scan-once` flag.
