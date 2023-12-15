---
title: Terminology
description: Explanation of common terms used in secco's documentation
---

secco uses the terms **source** and **destination** throughout its docs and messages. The **source** refers to the root folder that contains the package(s) that you want to test in other places. The **destination** refers to the folder you want to test your package(s) in. So your destination's `package.json` should have the source as a dependency.

:::note[Example]

```shell title="File tree"
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

The `ai-magic` repository is your fancy, new AI powered package that you publish to npm. This is your **source**. You now want to test this package inside a `test-project`. This is your **destination**.

:::
