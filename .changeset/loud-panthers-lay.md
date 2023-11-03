---
"secco": minor
---

Skip packages that have `"private": true` set in their `package.json`. npm and by extension Verdaccio will refuse to publish it. If your package is a `devDependency` then this will be fine but if it's a `dependency` you'll need to remove `private`. [Learn more in npm's docs](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#private).
