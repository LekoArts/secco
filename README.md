# secco

**Local package testing made easy.**

`secco` is a command-line tool for local development. It uses [Verdaccio](https://verdaccio.org/) and direct file copying to apply changes to test sites.

TODO

## Install

Using a global installation:

```shell
npm install --global secco
```

You can also use [`npx`](https://docs.npmjs.com/cli/v10/commands/npx) to invoke it.

```shell
npx secco --help
```

## Usage

It's recommended to go through the [tutorials](#tutorials) to understand how you can leverage `secco` in your projects.

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

#### `init`

TODO

#### `packages`

TODO

### Flags

TODO

## Tutorials

TODO

### Continuous Integration (CI)

TODO

## Acknowledgements

TODO

## License

TODO

## Name

TODO
