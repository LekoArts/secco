# Contributing

<a href="https://github.com/LekoArts/secco/blob/main/LICENSE">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="secco is released under the MIT license" />
</a>
<img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome!" />

Hi! We're excited that you are interested in contributing to secco. Before submitting your contribution, please read through the follow guide. Thanks!

## Setup

Make sure that you have at least [Node.js](https://nodejs.dev/en/) 20.19.0 or later installed. The secco repository uses [pnpm](https://pnpm.io/installation) as its package manager so you'll also need to [install pnpm](https://pnpm.io/installation). We'd recommend using `corepack enable`.

Install the dependencies:

```shell
pnmp install
```

You can build the CLI to `dist/cli.mjs` by running:

```shell
pnmp run build
```

You can build the source in watch mode like this:

```shell
pnmp run watch
```

## Testing

### Unit Testing

You can run all unit tests like so:

```shell
pnmp run test
```

### Integration Testing

You can run all integration tests like so:

```shell
pnmp run test:integration
```

### Testing with example project

You can also use your local version of the CLI in an example project.

For this, you should run `pnpm run watch` in the secco repository to build the CLI in watch mode.

Inside your example project, execute the CLI like so:

```shell
`node <path-to-secco-repo>/dist/cli.mjs`
```

## Documentation

Found a typo in the docs or want to contribute a new guide? Great! All docs live inside the [docs folder](https://github.com/LekoArts/secco/tree/main/docs). Its README has all the information you need to author new content for docs.
