---
title: Getting Started
description: New to secco? Get started here to get up and running!
---

secco is a command-line tool for local development. It uses [Verdaccio](https://verdaccio.org/) and direct file copying to apply your latest changes to other projects.

When developing and maintaining (multiple) packages, it's a real hassle to use something like `npm link`. But you also don't want to publish your changes to npm's remote registry. Both have a lot of pitfalls as they might break on complicated dependency chains or symlinking.

secco solves these problems and streamlines the process of local package testing.

## Install secco

Using a global installation:

```shell
npm install --global secco
```

You can also use [`npx`](https://docs.npmjs.com/cli/v10/commands/npx) to invoke it.

```shell
npx secco@latest --help
```

:::note

For secco to work correctly you'll need to have [Node.js](https://nodejs.dev) 18 or later installed.

:::

## Terminology

secco uses the terms **source** and **destination** throughout its docs and messages. The **source** refers to the root folder that contains the package(s) that you want to test in other places. The **destination** refers to the folder you want to test your package(s) in. So your destination's `package.json` should have the source as a dependency.

:::note[Example]

```shell
repositories
├── test-project
│   ├── cli.mjs
│   ├── node_modules
│   │   └── ai-magic
│   │       ├── index.mjs
│   │       └── package.json
│   └── package.json
└── ai-magic
    ├── index.mjs
    └── package.json
```

The `ai-magic` repository is your fancy, new AI powered package that you publish to npm. This is your **source**. You now want to test your package inside a `test-project`. This is your **destination**.

:::

## Initialize a `.seccorc` file

In order to link the destination to your source, secco utitlizes its own `.seccorc` configuration file. This way you only need to provide that information once, on all consecutive runs `secco` automatically looks in the right spot.

1. Navigate to your destination and run the following command in your terminal:

    ```shell
    secco init
    ```

1. When the prompt asks, **"What is the absolute path to your source?"**, enter the absolute path to your source.

    ```shell
    ? What is the absolute path to your source?
    ✔ · /Users/username/repositories/ai-magic
    ```

1. The prompt will show you a summary of what `secco init` will do. When the prompt asks, **"Do you want to create the file?"**, enter **"Y"**.

You should have a new `.seccorc` file inside your destination.

:::caution

secco **requires** to either find a `.seccorc` file in the destination (with [`source.path`](/reference/config/#sourcepath) set) or that the [`SECCO_SOURCE_PATH`](/reference/config/#secco_source_path) environment variable is defined.

:::

## Start secco

**Before starting secco**, you should ensure that your source is either built or that you have started your compilation in watch mode. Otherwise `secco` won't find anything to copy over.

Inside your destination, start `secco` like so:

```shell
secco
```

secco will now scan your destination's `package.json` file and compare its `dependencies`/`devDependencies` with packages that it can find inside the source.

If necessary, secco publishes your source to a local Verdaccio registry. This won't happen every time (especially on consecutive runs) as secco then just uses file copying directly. When Verdaccio is used, the terminal prints this:

```shell
[Verdaccio] Starting server...
[Verdaccio] Started successfully!
Publishing ai-magic@1.0.0-secco-1697394661753 to local registry...
Published ai-magic@1.0.0-secco-1697394661753 to local registry
Installing packages from local registry:
 - ai-magic
✔ Installation finished successfully!
```

In any case, when secco copies over the files from the source to destination you'll discover a similar terminal output:

```shell
Copied index.mjs to node_modules/ai-magic/index.mjs
Copied package.json to node_modules/ai-magic/package.json
```

Now go back to your source, edit a file, and let the file be re-compiled. secco should copy over the new file into your destination again.

:::tip[Want to follow a step-by-step tutorial?]

We also have a [Learn secco](/guide/learn-secco/) guide that goes into more detail of each step. You'll work with a demo project and learn more about secco's features.

:::

## What's next?

Browse the CLI reference: [commands](/reference/commands/), [config options](/reference/config/), and [flags](/reference/flags/). You can also check out the advanced guides like [How It Works](/guide/how-it-works/) or [Continuous Integration](/guide/continuous-integration/).
