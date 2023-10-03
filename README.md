# secco

**Local package testing made easy.**

`secco` is a command-line tool for local development. It uses [Verdaccio](https://verdaccio.org/) and direct file copying to apply your latest changes to other projects.

When developing and maintaining (multiple) packages, it's a real hassle to use something like `npm link`. But you also don't want to publish your changes to npm's remote registry. Both have a lot of pitfalls as they might break on complicated dependency chains or symlinking.

`secco` tries to solve these problems and streamlines the process of local package testing.

**Features:**

- **File Sync & Package Publishing.** By default, changes will be copied over from the source into the destination's `node_modules` folder. If necessary, changes are published to a local [Verdaccio](https://verdaccio.org/) registry first, so that you don't have to worry about symlinks or dependency hell.
- **Link Multiple Projects.** `secco` reads the `.seccorc` file to make the connection between destination and source. This allows you to use `secco` with as many source folders as you wish.
- **npm, yarn, and pnpm support.** You can use any of these package managers in your source and destination projects.
- **Watch and CI mode.** By default, `secco` starts a watch task. But you can also only run it once, enabling CI End-To-End testing use cases.
- **Workspaces (in source).** Your source folder can be a monorepo using workspaces.

Want to improve `secco`? Great! You can read the [Contributing guide](https://github.com/LekoArts/secco/blob/main/CONTRIBUTING.md) to learn more.

<a href="https://www.lekoarts.de?utm_source=secco">
  <img alt="lekoarts.de" src="https://img.shields.io/badge/-website-blue">
</a>
<a href="https://twitter.com/intent/follow?screen_name=lekoarts_de">
  <img src="https://img.shields.io/twitter/follow/lekoarts_de.svg?label=Follow%20@lekoarts_de" alt="Follow @lekoarts_de" />
</a>
<a href="https://mastodon.social/@lekoarts">
  <img alt="Mastodon Follow" src="https://img.shields.io/mastodon/follow/109244982385960702">
</a>

## Installation

Using a global installation:

```shell
npm install --global secco
```

You can also use [`npx`](https://docs.npmjs.com/cli/v10/commands/npx) to invoke it.

```shell
npx secco@latest
```

<a href="https://www.npmjs.org/package/secco">
  <img src="https://img.shields.io/npm/v/secco.svg" alt="Current npm package version." />
</a>
<a href="https://npmcharts.com/compare/secco?minimal=true">
  <img src="https://img.shields.io/npm/dm/secco.svg" alt="Downloads per month on npm." />
</a>
<a href="https://npmcharts.com/compare/secco?minimal=true">
  <img src="https://img.shields.io/npm/dt/secco.svg" alt="Total downloads on npm." />
</a>

## Usage

It's recommended to also go through the [usage guide](#usage-guide) to understand how you can leverage `secco` in your projects.

`secco` uses the terms **source** and **destination** throughout its docs and messages. The **source** refers to the root folder that contains the package(s) that you want to test in other places. The **destination** refers to the folder you want to test your package(s) in. So your destination's `package.json` should have the source as a dependency.

`secco` **requires** to either find a `.seccorc` file in the destination or that the following environment variable is defined: `SECCO_SOURCE_PATH`.

Here's an overview of all available commands and flags:

```shell
Usage: secco <command>

Commands:
  secco init                        Initialize a new .seccorc file
  secco packages [packageNames...]  Specify list of packages you want to link

Options:
  --help             Show help
  --version          Show version number
  --scan-once        Scan source once and do not start file watching
  --force-verdaccio  Disable file copying/watching and force usage of Verdaccio
  --verbose          Output verbose logging

Examples:
  secco                     Scan destination and copy files from source
  secco packages ars aurea  Copy specified packages from source to destination
```

### Commands

#### `secco init`

Run this command inside your destination folder. You'll be asked questions about your source folder and at the end of the questionnaire a new `.seccorc` config file will be created.

#### `secco`

`secco` will scan your destination's `package.json` file and compare it with the available packages inside your source. It'll then copy over all changes into your destination's `node_modules` folder. Additionally, a watch task is started to continue copying over changes.

Typically you'll want to also start a `watch` script inside your source to continuously compile your package artifacts.

#### `secco packages`

If you don't want `secco` to copy over all packages of your source, you can disable the automatic scan and instead provide a list of packages. Separate them by spaces like so:

```shell
secco packages ars aurea
```

### Flags

#### `--help`

Shows the help menu of `secco`

#### `--version`

Displays the current version of `secco`

#### `--scan-once`

As mentioned earlier, by default `secco` starts a watch script to listen for changes. If you want to disable this behavior, use `--scan-once`. This way `secco` will do an initial scan, copy the changes, and then quit.

This is useful for CI environments as you can e.g. set up automated test sites with latest code changes. See the [CI guide](#continuous-integration-ci) for more information.

#### `--force-verdaccio`

Disable the copying of files into `node_modules` and always use Verdaccio. This is helpful for ensuring in e.g. End-To-End test environments that the package installation is correct.

#### `--verbose`

Output additional debug logs and more information.

## Usage Guide

The goal of this guide is to explain a typical usage example of `secco`. It assumes that you have [Node.js](https://nodejs.dev) installed. You should also have a source (e.g. a npm package you're developing) and destination (e.g. an example Node.js project using your source) folder at hand.

Here's a simplified example of such a setup:

```shell
source/
├─ package.json
├─ src/
│  ├─ index.ts
├─ dist/
│  ├─ index.js
destination/
├─ package.json
├─ index.mjs
├─ node_modules/
│  ├─ source/
│  │  ├─ package.json
│  │  ├─ dist/
│  │  │  ├─ index.js
```

Inside `source` you have a `watch` and `build` script to compile the `src/index.ts` to `dist/index.js`. And inside `destination` your `index.mjs` script uses the dependency `source` (either as `dependency` or `devDependency`).

Now you want to copy over the changes from your package to your test project while iterating on your code.

1. Open a new terminal window and navigate to your `destination` folder
    1. Ensure that dependencies are installed by running `npm install` (or equivalent)
    1. Run `secco init` to initialize a new `.seccorc` file
1. Open a second terminal window and navigate to your `source` folder
    1. Ensure that dependencies are installed by running `npm install` (or equivalent)
    1. Build your project to compile its artifacts (in this example into the `dist` folder)
    1. Optionally start a `watch` script to auto-build your project
1. Go back to the `destination` terminal window and run `secco`
    1. `secco` should now compare your `destination` project with the packages inside `source`. Afterwards it copies over the changes into the destination's `node_modules` folder.
    1. Keep `secco` running as long as you wish
1. **Optional:** Instead of running `secco` as shown in the previous step, you can also run `secco packages source` to only watch the `source` package

### Continuous Integration (CI)

A great use case for `secco` is to copy over changes from your package to a test site used for End-to-End testing. You should use the `--force-verdaccio` flag to simulate package installation and `--scan-once` to not start the watch task.

Let's say you have the following repository:

```shell
dist/
├─ index.js
e2e-tests/
├─ kitchen-sink/
scripts/
├─ e2e-test.sh
src/
├─ index.ts
package.json
```

Then you'll want to copy your latest `dist` files into `e2e-tests/kitchen-sink` during the test run. The `e2e-test.sh` script could look something like this:

```sh
#!/bin/bash

TEST_PATH="e2e-tests/kitchen-sink"
# The YOUR_CI_WORKING_DIRECTORY depends on how/where you run this script
eval SOURCE_PATH=${YOUR_CI_WORKING_DIRECTORY:-../..}
TMP_LOCATION=$(mktemp -d);
# secco needs the SECCO_SOURCE_PATH environment variable
export SECCO_SOURCE_PATH=$SOURCE_PATH

mkdir -p $TMP_LOCATION/$TEST_PATH
TMP_TEST_LOCATION=$TMP_LOCATION/$TEST_PATH

mkdir -p $TMP_LOCATION/scripts/
mkdir -p $TMP_TEST_LOCATION

(command -v sudo && sudo npm install -g secco@latest) || npm install -g secco@latest

echo "Copy $TEST_PATH into $TMP_LOCATION to isolate test"
cp -Rv $TEST_PATH/. $TMP_TEST_LOCATION
cp -Rv $SOURCE_PATH/scripts/. $TMP_LOCATION/scripts/

cd "$TMP_TEST_LOCATION"

secco --force-verdaccio --scan-once

sh -c "npm run test"
```

Or in a more general way:

1. Figure out the absolute path to your source and set the `SECCO_SOURCE_PATH` environment variable
1. Install the `secco` CLI through `npm install -g secco@latest`
1. Run `secco --force-verdaccio --scan-once` inside your e2e test site
1. Run the test suite in your e2e test site

## Acknowledgements

I used to work at [Gatsby](https://github.com/gatsbyjs/gatsby) and we had an awesome tool there called [`gatsby-dev-cli`](https://github.com/gatsbyjs/gatsby/tree/06b0048529f6800d9e0c6cba72e3e47ec94b3290/packages/gatsby-dev-cli). It's battle-tested through our daily usage and served us really well. `secco` is a modernized and generalized version of this CLI, enabling me to have the same functionality everywhere. `secco` still has the same core functionality as `gatsby-dev-cli` so fortunately I was able to copy over a lot of code. For `gatsby-dev-cli` we never quite found the time to solve some smaller edge cases or DX quirks, so while authoring `secco` I tried to already fix some or lay the groundwork to enable better DX.

As often with side-projects I was also curious to try out some new tools, this time the awesome utils from [UnJS](https://unjs.io/). The `.rc` file handling is powered by [rc9](https://github.com/unjs/rc9), the much improved package manager handling is done through [nypm](https://github.com/unjs/nypm). They provide utils for many common use-cases when authoring developer tooling.

Last but not least, thanks to [Verdaccio](https://verdaccio.org/) for providing a great Node.js proxy registry.
