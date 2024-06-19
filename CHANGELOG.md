# secco

## 1.1.4

### Patch Changes

- [#80](https://github.com/LekoArts/secco/pull/80) [`be3104a`](https://github.com/LekoArts/secco/commit/be3104af3cf343b4779881952be84aa503b18de0) Thanks [@renovate](https://github.com/apps/renovate)! - Update internal dependencies, most notably valibot from 0.30.0 to 0.32.0

## 1.1.3

### Patch Changes

- [#58](https://github.com/LekoArts/secco/pull/58) [`94eb6be`](https://github.com/LekoArts/secco/commit/94eb6be8f120e576ebe0b3d617c841a95c276274) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies

- [`b92cdbd`](https://github.com/LekoArts/secco/commit/b92cdbdd2de0b332b72ff866a01920f22a92e411) Thanks [@LekoArts](https://github.com/LekoArts)! - Improve config parsing error messages and write unit tests for Valibot logic

## 1.1.2

### Patch Changes

- [`62fa0c6`](https://github.com/LekoArts/secco/commit/62fa0c64bb696ba277e8ab8d74775e86ce2791f2) Thanks [@LekoArts](https://github.com/LekoArts)! - When secco publishes a package to the local Verdaccio registry it's in the format `<pkg-name>@1.0.0-secco-1702997119379` where `1702997119379` is the `Date.now()` timestamp. The postfix got extended by using [`nanoid`](https://github.com/ai/nanoid) to add 4 characters at the end, e.g. `<pkg-name>@1.0.0-secco-1702998721042-9hax`.

  The goal of this is to mitigate collisions during publishing when at the same timestamp publishing happens to the instance.

- [`3a7b8e5`](https://github.com/LekoArts/secco/commit/3a7b8e502cabcf163b71428d2e18d2be763f1860) Thanks [@LekoArts](https://github.com/LekoArts)! - Adjust the default list of ignored files and directories to include lock files of popular package managers. Also a bug was fixed to now correctly exclude `src` when copying over changes from source to destination. Your logs (e.g. `Copied X to Y`) now **not** include any files inside `src`.

  Also a small bug was fixed that occurred when using the `--force-verdaccio` flag. Previously, the process ended even without the `--scan-once` flag.

## 1.1.1

### Patch Changes

- [#34](https://github.com/LekoArts/secco/pull/34) [`08ad44e`](https://github.com/LekoArts/secco/commit/08ad44ef05783c0edcd5fb7da4c9b5bf05d24033) Thanks [@LekoArts](https://github.com/LekoArts)! - After updating `valibot` to the latest version, the validation for environment variables wasn't behaving correctly. The custom validation is fixed now.

## 1.1.0

### Minor Changes

- [`f482749`](https://github.com/LekoArts/secco/commit/f4827499b030b3450cb3ef00f638321cb5e7972b) Thanks [@LekoArts](https://github.com/LekoArts)! - Support `VERBOSE` environment variable to enable verbose logging. You can use this as an alternative to `--verbose` flag.

- [`ba49078`](https://github.com/LekoArts/secco/commit/ba490783a18b3160185725c0084800ab328e0b08) Thanks [@LekoArts](https://github.com/LekoArts)! - Skip packages that have `"private": true` set in their `package.json`. npm and by extension Verdaccio will refuse to publish it. If your package is a `devDependency` then this will be fine but if it's a `dependency` you'll need to remove `private`. [Learn more in npm's docs](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#private).

### Patch Changes

- [`f0a80f8`](https://github.com/LekoArts/secco/commit/f0a80f89af7c7f1bb710f3b283716823df55e1ab) Thanks [@LekoArts](https://github.com/LekoArts)! - Improve some logs to make them more accurate and helpful

- [`b591967`](https://github.com/LekoArts/secco/commit/b5919678e8af4b8b02bfe253d5bddf79062889a6) Thanks [@LekoArts](https://github.com/LekoArts)! - Update `valibot` to latest version and handle deprecations

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
