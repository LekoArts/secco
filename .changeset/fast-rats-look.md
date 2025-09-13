---
"secco": minor
---

The CLI got more functionality!

- Add `-s` alias for `--scan-once` and `-f` for `--force-verdaccio`
- Add `--source` and `--yes` flag for `secco init`, making it possible to run the init command in non-interactive mode

    For example, this command will create a `.seccorc` file with the given source path:

    ```bash
    secco init --source=/absolute/path --yes
    ```

    If you don't provide the `--yes` flag you'll need to confirm the prompt.
