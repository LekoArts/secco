---
"secco": patch
---

When secco publishes a package to the local Verdaccio registry it's in the format `<pkg-name>@1.0.0-secco-1702997119379` where `1702997119379` is the `Date.now()` timestamp. The postfix got extended by using [`nanoid`](https://github.com/ai/nanoid) to add 4 characters at the end, e.g. `<pkg-name>@1.0.0-secco-1702998721042-9hax`.

The goal of this is to mitigate collisions during publishing when at the same timestamp publishing happens to the instance.
