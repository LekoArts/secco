# secco

**Local package testing made easy.**

secco is a command-line tool for local development. It uses [Verdaccio](https://verdaccio.org/) and direct file copying to apply your latest changes to other projects.

When developing and maintaining (multiple) packages, it's a real hassle to use something like `npm link`. But you also don't want to publish your changes to npm's remote registry. Both have a lot of pitfalls as they might break on complicated dependency chains or symlinking.

secco solves these problems and streamlines the process of local package testing.

**Want to try it?** Start with our [Getting Started](https://secco.lekoarts.de/guide/) guide. Need a longer explanation? Read our [Learn secco](https://secco.lekoarts.de/guide/learn-secco/) tutorial.

**Features:**

- **File Sync & Package Publishing.** By default, changes will be copied over from the source into the destination's `node_modules` folder. If necessary, changes are published to a local [Verdaccio](https://verdaccio.org/) registry first, so that you don't have to worry about symlinks or dependency hell.
- **Link Multiple Projects.** secco reads the `.seccorc` file to make the connection between destination and source. This allows you to use `secco` with as many source folders as you wish.
- **npm, yarn, pnpm, and bun support.** You can use any of these package managers in your source and destination projects.
- **Watch and CI mode.** By default, secco starts a watch task. But you can also only run it once, enabling CI End-To-End testing use cases.
- **Workspaces (in source).** Your source folder can be a monorepo using workspaces.

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
npx secco@latest --help
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

It's recommended to also go through the [Getting Started](https://secco.lekoarts.de/guide/) guide to understand how you can leverage `secco` in your projects.

secco uses the terms **source** and **destination** throughout its docs and messages. The **source** refers to the root folder that contains the package(s) that you want to test in other places. The **destination** refers to the folder you want to test your package(s) in. So your destination's `package.json` should have the source as a dependency.

secco **requires** to either find a `.seccorc` file in the destination (with `source.path` set) or that the `SECCO_SOURCE_PATH` environment variable is defined.

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

## Documentation

Visit secco's [official documentation](https://secco.lekoarts.de)

## Contributing

Want to improve secco? Great! Read the [Contributing guide](https://github.com/LekoArts/secco/blob/main/CONTRIBUTING.md) to get started.
