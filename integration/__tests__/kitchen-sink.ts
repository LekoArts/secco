import type { SetupReturn } from '../helpers/setup-kitchen-sink'
import { KitchenSink } from '../helpers/setup-kitchen-sink'

describe.sequential('mode: sequential', () => {
  let cleanup: SetupReturn['cleanup']
  let cli: SetupReturn['cli']

  beforeAll(async () => {
    const { cleanup: _cleanup, cli: _cli } = await KitchenSink().setup()

    cleanup = _cleanup
    cli = _cli
  })

  afterAll(async () => {
    await cleanup()
  })

  it('should run Verdaccio with --force-verdaccio', () => {
    const [exitCode, logs] = cli(['--scan-once', '--force-verdaccio'], { verbose: true })

    logs.should.contain('[log] [Verdaccio] Starting server...')
    logs.should.contain('[log] [Verdaccio] Started successfully!')
    logs.should.contain('[log] Publishing `say-hello-world@0.0.2-secco-')
    logs.should.contain('[log] Published `say-hello-world@0.0.2-secco-')
    logs.should.contain('[log] Installing packages from local registry:')
    logs.should.contain('[success] Installation finished successfully!')

    expect(exitCode).toBe(0)
  })

  it('verbose should be enabled through --verbose flag', () => {
    const [exitCode, logs] = cli(['--verbose', '--scan-once'])

    logs.should.contain('[debug] Found 1 packages in source.')
    logs.should.contain('[debug] Found 1 destination packages.')

    expect(exitCode).toBe(0)
  })

  it('verbose should be enabled through VERBOSE env var', () => {
    const [exitCode, logs] = cli(['--scan-once'], { verbose: true })

    logs.should.contain('[debug] Found 1 packages in source.')
    logs.should.contain('[debug] Found 1 destination packages.')

    expect(exitCode).toBe(0)
  })

  it('should copy files on consecutive runs', () => {
    const [exitCode, logs] = cli(['--scan-once'], { verbose: true })

    logs.should.not.contain('[log] [Verdaccio] Starting server...')
    logs.should.not.contain('[success] Installation finished successfully!')
    logs.should.contain('[log] Copied `index.mjs` to `node_modules/say-hello-world/index.mjs`')
    logs.should.contain('[log] Copied `package.json` to `node_modules/say-hello-world/package.json`')
    logs.should.contain('[info] Copied 2 files. Exiting...')

    expect(exitCode).toBe(0)
  })
})
