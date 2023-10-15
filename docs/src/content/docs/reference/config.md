---
title: Config
description: Reference page of secco's available config options
sidebar:
  order: 2
---

## Configuration

`secco` will read your root `.seccorc` file when it is present to parse its [options](#options). Using a configuration file is the recommended approach.

If you don't want to create a configuration file on the fly (like in [Continuous Integration](/guide/continuous-integration/) environments) you can use [environment variables](#environment-variables) for secco's required options.

## Options

### `source.path`

- **Required**
- **Type:** `string`

The **absolute** path to your source.

## Environment Variables

### `SECCO_SOURCE_PATH`

- **Required** (if [`source.path`](#sourcepath) is not set)
- **Type:** `string`

Equivalent to `source.path`.

### `VERBOSE`

- **Type:** `boolean`
- **Default:** `false`

Equivalent to the [`--verbose`](/reference/flags/#--verbose) flag.
