module.exports = {
  hooks: {
    readPackage: (pkg) => {
      // Remove the dependency from the package.json inside integration/fixtures
      delete pkg.dependencies['say-hello-world-secco']

      return pkg
    },
  },
}
