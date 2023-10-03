---
title: Features
description: A guide in my new Starlight docs site.
---

- **File Sync & Package Publishing.** By default, changes will be copied over from the source into the destination's `node_modules` folder. If necessary, changes are published to a local [Verdaccio](https://verdaccio.org/) registry first, so that you don't have to worry about symlinks or dependency hell.
- **Link Multiple Projects.** `secco` reads the `.seccorc` file to make the connection between destination and source. This allows you to use `secco` with as many source folders as you wish.
- **npm, yarn, and pnpm support.** You can use any of these package managers in your source and destination projects.
- **Watch and CI mode.** By default, `secco` starts a watch task. But you can also only run it once, enabling CI End-To-End testing use cases.
- **Workspaces (in source).** Your source folder can be a monorepo using workspaces.
