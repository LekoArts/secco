---
title: Global Flags
description: Reference page of secco's available global flags
sidebar:
  order: 99999
---

These are the flags that you can use throughout the CLI. If not noted otherwise, you can use them with every command.

## `--help`

Shows the help menu of `secco`. You can also show help menus of subcommands, e.g. `secco packages --help`.

## `--version`

Displays the current version of `secco`.

## `--verbose`

Output additional debug logs and more information.

## `--scan-once`

- **Alias:** `-s`

- **Commands:** `secco`, `secco packages`

By default `secco` starts a watch script to listen for changes. If you want to disable this behavior, use `--scan-once`. This way `secco` will do an initial scan, copy the changes, and then quit.

This is useful for CI environments as you can e.g. set up automated test sites with latest code changes. See the [CI guide](/guide/continuous-integration/) for more information.

## `--force-verdaccio`

- **Alias:** `-f`

- **Commands:** `secco`, `secco packages`

Disable the copying of files into `node_modules` and always use Verdaccio. This is helpful for ensuring in e.g. End-To-End test environments that the package installation is correct.
