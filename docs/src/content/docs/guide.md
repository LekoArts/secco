---
title: Getting Started
description: A guide in my new Starlight docs site.
---

`secco` is a command-line tool for local development. It uses [Verdaccio](https://verdaccio.org/) and direct file copying to apply your latest changes to other projects.

When developing and maintaining (multiple) packages, it's a real hassle to use something like `npm link`. But you also don't want to publish your changes to npm's remote registry. Both have a lot of pitfalls as they might break on complicated dependency chains or symlinking.

`secco` tries to solve these problems and streamlines the process of local package testing.

## Installing secco

Using a global installation:

```shell
npm install --global secco
```

You can also use [`npx`](https://docs.npmjs.com/cli/v10/commands/npx) to invoke it.

```shell
npx secco@latest
```

:::note
For secco to work correctly you'll need to have [Node.js](https://nodejs.dev) 18 or later installed.

:::

## Terminology

`secco` uses the terms **source** and **destination** throughout its docs and messages. The **source** refers to the root folder that contains the package(s) that you want to test in other places. The **destination** refers to the folder you want to test your package(s) in. So your destination's `package.json` should have the source as a dependency.
