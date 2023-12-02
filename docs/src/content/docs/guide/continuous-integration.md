---
title: Continuous Integration (CI)
description: Tutorial on how to use secco in CI environments
---

A great use case for secco is to copy over changes from your package to a test site used for End-to-End testing. This way you can verify that your published and built package works consistently.

In this guide you'll learn which secco CLI options to use and how to set up your CI workflow.

:::note

Regardless of your CI provider or overall setup, you should use the `--force-verdaccio` flag to simulate package installation and `--scan-once` to not start the watch task.

:::

## Prerequisites

Let's say you have the following setup:

```shell title="File tree"
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

Your source file lives inside `src` and is compiled to the `dist` folder. You created one of many test sites for End-to-End testing purposes inside `e2e-tests`.

Now, inside your CI you want to copy `e2e-tests/kitchen-sink` to a temporary folder to isolate it. Afterwards your latest changes from `dist` are copied to that temporary folder through installation.

## Scripts

For the purpose of this guide a couple of script were chosen to explain the necessary steps. You can use any tool you like though, for example [execa's scripts interface](https://github.com/sindresorhus/execa#scripts-interface).

Generally speaking, you'll want to run the script like so:

1. Figure out the absolute path to your source and set the `SECCO_SOURCE_PATH` environment variable
1. Create a temporary folder (e.g. inside the system's `tmp` folder)
1. Install the `secco` CLI through `npm install -g secco@latest`
1. Copy the contents of your test site into the temporary folder
1. Navigate into the new temporary folder
1. Run `secco --force-verdaccio --scan-once` inside your e2e test site
1. Run the test suite in your e2e test site

### Bash

```bash title="e2e-test.sh"
#!/bin/bash
set -e # Bail on errors

# Setup variables and env vars

TEST_PATH=$1 # First script arg
TEST_COMMAND="${2:-npm run test}" # Second script arg
# The YOUR_CI_WORKING_DIRECTORY depends on how/where you run this script
eval SOURCE_PATH=${YOUR_CI_WORKING_DIRECTORY:-../..}
TMP_LOCATION=$(mktemp -d);
# secco needs the SECCO_SOURCE_PATH environment variable
export SECCO_SOURCE_PATH=$SOURCE_PATH

# Create the temporary folders

mkdir -p $TMP_LOCATION/$TEST_PATH
TMP_TEST_LOCATION=$TMP_LOCATION/$TEST_PATH
mkdir -p $TMP_TEST_LOCATION

# Install the secco CLI

(command -v sudo && sudo npm install -g secco@latest) || npm install -g secco@latest

# Copy the test suite into the temporary location to isolate it

echo "Copy $TEST_PATH into $TMP_LOCATION to isolate test"
cp -Rv $TEST_PATH/. $TMP_TEST_LOCATION

cd "$TMP_TEST_LOCATION"

# Run the secco CLI once

secco --force-verdaccio --scan-once

# Run the End-to-End tests

sh -c "$TEST_COMMAND"
```

### zx

You can use [`google/zx`](https://google.github.io/zx/) to write a script.

Install the necessary dependencies:

```shell
npm install zx @actions/core
```

Create a new file, e.g. called `install-site-in-isolation.mjs`:

```js title="install-site-in-isolation.mjs"
#!/usr/bin/env zx

import { cp, mkdir, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import * as core from '@actions/core'
import { $, argv, cd, chalk } from 'zx'

try {
  // Setup variables and environment variables
  const SITE_PATH = argv._[0]
  const ROOT_PATH = new URL('../', import.meta.url).pathname
  const FULL_SITE_PATH = join(ROOT_PATH, SITE_PATH)
  const TMP_FOLDER = await mkdtemp(join(tmpdir(), 'secco-site-'))
  const FULL_TMP_FOLDER = join(TMP_FOLDER, SITE_PATH)
  process.env.SECCO_SOURCE_PATH = ROOT_PATH
  process.env.FORCE_COLOR = '1'

  core.debug(`Path variables:

SITE_PATH: ${SITE_PATH}
ROOT_PATH: ${ROOT_PATH}
FULL_SITE_PATH: ${FULL_SITE_PATH}
TMP_FOLDER: ${TMP_FOLDER}
FULL_TMP_FOLDER: ${FULL_TMP_FOLDER}`)

  // Installing secco
  await core.group('Installing secco (if not already installed)', async () => {
    await $`command -v secco || (command -v sudo && sudo npm install -g secco@latest) || npm install -g secco@latest`
  })

  // Create temporary folder setup
  await mkdir(FULL_TMP_FOLDER, { recursive: true })

  // Copy the site into the temporary location to isolate it
  core.info(`Copying ${chalk.bold(SITE_PATH)} into ${chalk.bold(FULL_TMP_FOLDER)}`)
  await cp(FULL_SITE_PATH, FULL_TMP_FOLDER, { recursive: true })

  await core.group('Installing dependencies through secco', async () => {
    cd(FULL_TMP_FOLDER)
    await $`secco --force-verdaccio --scan-once`
  })

  core.exportVariable('FULL_TMP_FOLDER', FULL_TMP_FOLDER)
}
catch (e) {
  // Bail on errors
  core.setFailed(`Script failed with error: ${e}`)
}
```

This script won't run your tests yet, you'd need to add the functionality to the script or use the exported environment variable `FULL_TMP_FOLDER` for later steps ([GitHub Actions](#github-actions)).

## CI workflows

### CircleCI

You could run the [bash script](#bash-script) inside CircleCI like so:

```yml title=".circleci/config.yml"
commands:
  e2e-test:
    parameters:
      test_path:
        type: string
      test_command:
        type: string
        default: npm run test
    steps:
      - checkout
      - run:
          name: Run e2e tests
          command: ./scripts/e2e-test.sh "<< parameters.test_path >>" "<< parameters.test_command >>"
```

### GitHub Actions

You could use the [zx](#zx) script inside GitHub actions like so:

```yml title=".github/workflows/e2e-test.yml"
name: E2E Tests
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          ref: refs/pull/${{ github.event.issue.number }}/head

      - name: Install dependencies & setup repo
        run: # Your setup

      - name: Build packages
        run: # Your build setup

      - name: Install site in isolation
        run: node scripts/install-site-in-isolation.mjs e2e-tests/kitchen-sink

      - name: Run tests
        run: |
          cd $FULL_TMP_FOLDER
          npm run test
```

You'll probably want to adapt the workflow to use [matrix](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs) so that you can run multiple tests (if you have more than one).
