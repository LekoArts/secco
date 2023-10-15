---
title: Acknowledgements
description: Giving props to projects that made secco possible
---

I used to work at [Gatsby](https://github.com/gatsbyjs/gatsby) and we had an awesome tool there called [`gatsby-dev-cli`](https://github.com/gatsbyjs/gatsby/tree/06b0048529f6800d9e0c6cba72e3e47ec94b3290/packages/gatsby-dev-cli). It's battle-tested through our daily usage and served us really well. `secco` is a modernized and generalized version of this CLI, enabling me to have the same functionality everywhere. `secco` still has the same core functionality as `gatsby-dev-cli` so fortunately I was able to copy over a lot of code. For `gatsby-dev-cli` we never quite found the time to solve some smaller edge cases or DX quirks, so while authoring `secco` I tried to already fix some or lay the groundwork to enable better DX.

As often with side-projects I was also curious to try out some new tools, this time the awesome utils from [UnJS](https://unjs.io/). The `.rc` file handling is powered by [rc9](https://github.com/unjs/rc9), the much improved package manager handling is done through [nypm](https://github.com/unjs/nypm). They provide utils for many common use-cases when authoring developer tooling.

Last but not least, thanks to [Verdaccio](https://verdaccio.org/) for providing a great Node.js proxy registry.
