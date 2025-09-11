---
"secco": minor
---

If your source packages have a `files` array inside their `package.json` secco will now respect that when copying over files. It will only copy over the files defined in `files`.

Previously, if for example your source package had this structure:

```sh
.
└── package/
    ├── src
    ├── dist
    ├── unrelated-folder
    └── README.md
```

Then secco would have copied over the `unrelated-folder`, too. With `files: ["dist"]` it'll only copy that.
