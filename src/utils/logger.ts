import { createConsola } from 'consola'

export const logger = createConsola({
  formatOptions: {
    compact: true,
    date: false,
  },
})
