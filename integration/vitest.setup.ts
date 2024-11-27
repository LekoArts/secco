import { beforeAll } from 'vitest'

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * In order to avoid port conflicts, set a random port for Verdaccio. This way multiple tests can run in parallel.
 */
beforeAll(() => {
  process.env.SECCO_VERDACCIO_PORT = randomInteger(4000, 5000).toString()
})
