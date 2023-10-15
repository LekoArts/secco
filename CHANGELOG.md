# secco

## 1.0.3

### Patch Changes

- [#12](https://github.com/LekoArts/secco/pull/12) [`a4153eb`](https://github.com/LekoArts/secco/commit/a4153ebde78659e67291c1f78491a1de932f0a21) Thanks [@LekoArts](https://github.com/LekoArts)! - Use correct `fs-extra/esm` subpath were needed to mitigate `fs.readJsonSync is not a function`

- [`516b96a`](https://github.com/LekoArts/secco/commit/516b96a35cec793aa25635347cabb1831b1e9438) Thanks [@LekoArts](https://github.com/LekoArts)! - Use correct `save-exact` flag for pnpm

## 1.0.2

### Patch Changes

- [`78528e5`](https://github.com/LekoArts/secco/commit/78528e581eaa47ecc5d7ed35a6de9af3c7c2cadc) Thanks [@LekoArts](https://github.com/LekoArts)! - Revert previous change in 1.0.1 as fs-extra has no full ESM support

## 1.0.1

### Patch Changes

- [#8](https://github.com/LekoArts/secco/pull/8) [`79bf441`](https://github.com/LekoArts/secco/commit/79bf441ff1cce1683cb910fa4c5c7df7dfc77aaf) Thanks [@LekoArts](https://github.com/LekoArts)! - Refactor the internal usage of `fs-extra` to use named imports, not the default import. Things should continue to work as usual.

## 1.0.0

### Major Changes

- [`c417042`](https://github.com/LekoArts/secco/commit/c4170422e4a88853bc3273e27e5279ca4c188681) Thanks [@LekoArts](https://github.com/LekoArts)!

  Hello 👋🏻

  Welcome to secco's first release. After testing it for a while locally I'm now releasing it as a stable `1.0.0` version. This makes it easier to follow semver best practices anyways.

  Have fun using it!
