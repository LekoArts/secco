# secco

## 2.3.1

### Patch Changes

- [#126](https://github.com/LekoArts/secco/pull/126) [`c2a3445`](https://github.com/LekoArts/secco/commit/c2a34454c93a38c01f3de504282f98a76c41eb62) Thanks [@LekoArts](https://github.com/LekoArts)! - Do not try to publish twice if workspace/catalog protocol (pnpm) is used in source with --force-verdaccio

## 2.3.0

### Minor Changes

- [#124](https://github.com/LekoArts/secco/pull/124) [`39f7eca`](https://github.com/LekoArts/secco/commit/39f7ecae275ee4fc74305f105b4918d2628f9668) Thanks [@LekoArts](https://github.com/LekoArts)! - Add support for pnpm's [`workspace:` protocol](https://pnpm.io/workspaces) and [`catalog:`](https://pnpm.io/catalogs) features inside the source directory.

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

## 2.2.0

### Minor Changes

- [#99](https://github.com/LekoArts/secco/pull/99) [`1593131`](https://github.com/LekoArts/secco/commit/159313193103ba27f8c5fed5915e0a88552e617e) Thanks [@LekoArts](https://github.com/LekoArts)! - Support Yarn Berry (currently v3 & v4) by modyfing the `.yarnrc.yml` file inside the destination before trying to install packages from the local Verdaccio registry

- [#101](https://github.com/LekoArts/secco/pull/101) [`d4d8ef9`](https://github.com/LekoArts/secco/commit/d4d8ef98085e74d0869af0a17b43f13989b0848e) Thanks [@LekoArts](https://github.com/LekoArts)! - Add `SECCO_VERDACCIO_PORT` environment variable. You can use this to change the default port (`4873`) when secco uses Verdaccio.

- [#101](https://github.com/LekoArts/secco/pull/101) [`d4d8ef9`](https://github.com/LekoArts/secco/commit/d4d8ef98085e74d0869af0a17b43f13989b0848e) Thanks [@LekoArts](https://github.com/LekoArts)! - You can now use secco inside destinations that are set up with [workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces). It should work for all supported package managers (npm, yarn, pnpm, bun).

  Please note: secco will automatically use the `--force-verdaccio` flag when inside a workspaces project.

### Patch Changes

- [#101](https://github.com/LekoArts/secco/pull/101) [`d4d8ef9`](https://github.com/LekoArts/secco/commit/d4d8ef98085e74d0869af0a17b43f13989b0848e) Thanks [@LekoArts](https://github.com/LekoArts)! - Correctly display additional information e.g. during `npm install` when `VERBOSE` env var is set

## 2.1.0

### Minor Changes

- [#96](https://github.com/LekoArts/secco/pull/96) [`69c2d17`](https://github.com/LekoArts/secco/commit/69c2d17613f00ae7ca02affc12854a05969d4d86) Thanks [@LekoArts](https://github.com/LekoArts)! - Add full support for [Bun](https://bun.sh/) by correctly setting the npm registry during `bun add`. This is achieved by using the `BUN_CONFIG_REGISTRY` environment variable.

## 2.0.0

### Major Changes

- [#87](https://github.com/LekoArts/secco/pull/87) [`2de166e`](https://github.com/LekoArts/secco/commit/2de166e16ac9e350d39943ff8f76518eae40b63b) Thanks [@renovate](https://github.com/apps/renovate)! - Update [`execa`](https://github.com/sindresorhus/execa) from 8.0.1 to 9.3.0. The new v9 major version now requires at least Node.js `^18.19.0 || >=20.5.0`.

  Since `secco` supported Node.js >=18.0.0 in v1, this dependency update warrants a major update to also update secco's `engines` key.

  **Breaking change:** secco now requires Node.js `^18.19.0 || >=20.5.0` or later. This also means that the unstable Node.js 19 is no longer supported.

### Patch Changes

- [#94](https://github.com/LekoArts/secco/pull/94) [`2eb523b`](https://github.com/LekoArts/secco/commit/2eb523ba563bc012781a3eb28ebb1f765a74a1f3) Thanks [@LekoArts](https://github.com/LekoArts)! - Improve error message when no packages are found for watching

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
