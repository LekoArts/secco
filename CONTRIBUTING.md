# Contributing

<a href="https://github.com/LekoArts/secco/blob/main/LICENSE">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="secco is released under the MIT license" />
</a>
<img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome!" />

Hi! We're excited that you are interested in contributing to secco. Before submitting your contribution, please read through the follow guide. Thanks!

Make sure that you have at least [Node.js](https://nodejs.dev/en/) 18 or later installed. The secco repository uses [pnpm](https://pnpm.io/installation) as its package manager.

To develop and test secco:

1. Run `pnmp install` to install the dependencies
1. Run `pnpm run watch` to build sources in watch mode
1. Run `pnpm run test` to run all unit tests

If you want to test secco in an example project of yours, do the following:

1. Run `pnpm run watch` in the secco repository
1. Run `node <path-to-secco-repo>/dist/cli.mjs` inside your example project to execute the CLI from your local secco repository.
