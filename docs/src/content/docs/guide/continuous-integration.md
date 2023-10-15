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

Your source file lives inside `src` and is compiled to the `dist` folder. You created one of many test sites for End-to-End testing purposes inside `e2e-tests`.

Now, inside your CI you want to copy your latest changes from `dist` to `e2e-tests/kitchen-sink` through installation.

## Bash script

For the purpose of this guide a bash script was chosen to explain the necessary steps. It's not required though, you can also use something like [execa's scripts interface](https://github.com/sindresorhus/execa#scripts-interface) if you want.

The script could look something like this:

```sh
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

Or in a more general way:

1. Figure out the absolute path to your source and set the `SECCO_SOURCE_PATH` environment variable
1. Create a temporary folder (e.g. inside the system's `tmp`)
1. Install the `secco` CLI through `npm install -g secco@latest`
1. Copy the contents of your test site into the temporary folder
1. Navigate into the new temporary folder
1. Run `secco --force-verdaccio --scan-once` inside your e2e test site
1. Run the test suite in your e2e test site

## CI workflows

Below you'll find explanations on how to use the [bash script](#bash-script) inside various CI workflows.

### CircleCI

```yml
# .circleci/config.yml

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

This guide is still missing. Want to help write it? Read the [Contributing guide](https://github.com/LekoArts/secco/blob/main/CONTRIBUTING.md) to get started.
