export function createLogsMatcher(output: string) {
  return {
    logOutput() {
      // eslint-disable-next-line no-console
      console.log(output)
    },

    should: {
      contain: (match: string) => expect(output).toContain(match),
      not: {
        contain: (match: string) => expect(output).not.toContain(match),
      },
    },
  }
}
