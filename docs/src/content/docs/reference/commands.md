---
title: Commands
description: Reference page of secco's available commands
sidebar:
  order: 1
---

## `secco init`

Run this command inside your destination folder. You'll be asked questions about your source folder and at the end of the questionnaire a new `.seccorc` config file will be created.

## `secco`

`secco` will scan your destination's `package.json` file and compare it with the available packages inside your source. It'll then copy over all changes into your destination's `node_modules` folder. Additionally, a watch task is started to continue copying over changes. Packages that have [`"private": true`](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#private) set will be ignored.

Typically you'll want to also start a `watch` script inside your source to continuously compile your package artifacts.

## `secco packages`

If you don't want the default [`secco` command](#secco) to copy over all packages of your source, you can use the `secco packages` command.

It allows you to provide a list of packages for secco to watch. Separate them by spaces like so:

```shell
secco packages ars aurea
```

You need to use the exact package names, things like regexp or glob patterns are not supported.
