---
"secco": major
---

Update [`execa`](https://github.com/sindresorhus/execa) from 8.0.1 to 9.3.0. The new v9 major version now requires at least Node.js `^18.19.0 || >=20.5.0`.

Since `secco` supported Node.js >=18.0.0 in v1, this dependency update warrants a major update to also update secco's `engines` key.

**Breaking change:** secco now requires Node.js `^18.19.0 || >=20.5.0` or later. This also means that the unstable Node.js 19 is no longer supported.
