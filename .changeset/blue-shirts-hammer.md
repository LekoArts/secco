---
"secco": patch
---

Various small bug fixes:

- When `dist/` was in the `files` array of `package.json` it didn't correctly copy over files inside the `dist` directory
- When `--scan-once` and `--force-verdaccio` were used together a warning was thrown about an ungraceful exit. For this codepath any cleanup tasks are run before exiting now. The warning won't show.
- The `init` command ran the whole main function while it should only run the Enquirer prompt. This is fixed now.
