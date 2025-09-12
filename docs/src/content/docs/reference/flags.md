---
title: Global Flags
description: Reference page of secco's available global flags
sidebar:
  order: 99999
---

These are the flags that you can use with any command.

## `--help`

Shows the help menu of `secco`.

## `--version`

Displays the current version of `secco`.

## `--scan-once`

**Alias:** `-s`.

By default `secco` starts a watch script to listen for changes. If you want to disable this behavior, use `--scan-once`. This way `secco` will do an initial scan, copy the changes, and then quit.

This is useful for CI environments as you can e.g. set up automated test sites with latest code changes. See the [CI guide](/guide/continuous-integration/) for more information.

## `--force-verdaccio`

**Alias:** `-f`.

Disable the copying of files into `node_modules` and always use Verdaccio. This is helpful for ensuring in e.g. End-To-End test environments that the package installation is correct.

## `--verbose`

Output additional debug logs and more information.
