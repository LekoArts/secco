import type { Application } from '../models/application'
import { presets } from '../presets'

describe.sequential('kitchen sink (single package)', () => {
  let app: Application

  beforeAll(async () => {
    app = await presets.kitchenSink.commit()
  })

  afterAll(async () => {
    await app.cleanup()
  })

  it('should run Verdaccio with --force-verdaccio', () => {
    const [exitCode, logs] = app.cli(['--scan-once', '--force-verdaccio'], { verbose: true })

    logs.should.contain('[log] [Verdaccio] Starting server...')
    logs.should.contain('[log] [Verdaccio] Started successfully!')
    logs.should.contain('[log] Publishing `say-hello-world@0.0.2-secco-')
    logs.should.contain('[log] Published `say-hello-world@0.0.2-secco-')
    logs.should.contain(`[debug] Detected package manager in destination: ${app.packageManager.split('@')[0]}`)
    logs.should.contain('[log] Installing packages from local registry:')
    logs.should.contain('[success] Installation finished successfully!')

    expect(exitCode).toBe(0)
  })

  it('verbose should be enabled through --verbose flag', () => {
    const [exitCode, logs] = app.cli(['--verbose', '--scan-once'])

    logs.should.contain('[debug] Found 1 package in source.')
    logs.should.contain('[debug] Found 1 package in destination.')

    expect(exitCode).toBe(0)
  })

  it('verbose should be enabled through VERBOSE env var', () => {
    const [exitCode, logs] = app.cli(['--scan-once'], { verbose: true })

    logs.should.contain('[debug] Found 1 package in source.')
    logs.should.contain('[debug] Found 1 package in destination.')

    expect(exitCode).toBe(0)
  })

  it('should copy files on consecutive runs', () => {
    const [exitCode, logs] = app.cli(['--scan-once'], { verbose: true })

    logs.should.not.contain('[log] [Verdaccio] Starting server...')
    logs.should.not.contain('[success] Installation finished successfully!')
    logs.should.contain('[log] Copied `index.mjs` to `node_modules/say-hello-world/index.mjs`')
    logs.should.contain('[log] Copied `package.json` to `node_modules/say-hello-world/package.json`')
    logs.should.contain('[info] Copied 2 files. Exiting...')

    expect(exitCode).toBe(0)
  })
})
