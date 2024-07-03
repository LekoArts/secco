import { colors as consolaColors } from 'consola/utils'

const colors = [
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'redBright',
  'greenBright',
  'yellowBright',
  'blueBright',
  'magentaBright',
  'cyanBright',
] as const

type Color = typeof colors[number]

function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)]
}

interface CreateLoggerOptions {
  prefix: string
  color?: Color
}

export function createLogger(opts: CreateLoggerOptions) {
  const { prefix, color = getRandomColor() } = opts

  return {
    log: (msg: string) => {
      // eslint-disable-next-line no-console
      console.log(consolaColors[color](`[${prefix}] ${msg}`))
    },
  }
}
