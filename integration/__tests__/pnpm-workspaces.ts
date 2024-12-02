import type { Application } from '../models/application'
import getPort from 'get-port'
import { presets } from '../presets'

const isPnpm = process.env.INTEGRATION_PM_NAME === 'pnpm'

describe.runIf(isPnpm)('pnpm workspaces', () => {
  let app: Application

  beforeAll(async () => {
    app = await presets.pnpmWorkspaces.commit()

    process.env.SECCO_VERDACCIO_PORT = (await getPort()).toString()
  })

  afterAll(async () => {
    await app.cleanup()
  })

  it('should support protocol and catalogs', () => {
    const [exitCode, logs] = app.cli(['--scan-once', '--force-verdaccio', '--verbose', 'packages', 'say-hello-world'])

    logs.should.contain('[log] [Verdaccio] Starting server...')
    logs.should.contain('[log] [Verdaccio] Started successfully!')
    logs.should.contain('[log] Publishing `say-hello-world@0.0.2-secco-')
    logs.should.contain('[log] Published `say-hello-world@0.0.2-secco-')
    logs.should.contain(`[debug] Detected package manager in source: ${app.packageManager.split('@')[0]}`)
    logs.should.contain(`[debug] Detected package manager in destination: ${app.packageManager.split('@')[0]}`)
    logs.should.contain('[debug] Adjusted pnpm workspaces features for say-hello-world: workspace:, catalog:default, catalog:<name>')
    logs.should.contain('[log] Installing packages from local registry:')
    logs.should.contain('[success] Installation finished successfully!')

    expect(exitCode).toBe(0)
  })
})
