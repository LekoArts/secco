import type { Application } from '../../models/application'
import getPort from 'get-port'
import { renameFixture } from '../../helpers/renamer'
import { presets } from '../../presets'

describe.sequential('scan-once', () => {
  describe.sequential('single package', () => {
    let app: Application

    beforeAll(async () => {
      app = await presets.kitchenSink.commit()

      process.env.SECCO_VERDACCIO_PORT = (await getPort()).toString()
    })

    afterAll(async () => {
      await app.cleanup()
    })

    it('should run Verdaccio with --force-verdaccio', () => {
      const [exitCode, logs] = app.cli(['--scan-once', '--force-verdaccio', '--verbose'])

      logs.should.contain('[log] [Verdaccio] Starting server...')
      logs.should.contain('[log] [Verdaccio] Started successfully!')
      logs.should.contain('[log] Publishing `say-hello-world@0.0.2-secco-')
      logs.should.contain('[log] Published `say-hello-world@0.0.2-secco-')
      logs.should.contain(`[debug] Detected package manager in destination: ${app.packageManager.split('@')[0]}`)
      logs.should.contain('[log] Installing packages from local registry:')
      logs.should.contain('[success] Installation finished successfully!')

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

  describe.sequential('workspaces', () => {
    let app: Application

    beforeAll(async () => {
      app = await presets.kitchenSinkWorkspaces.commit()

      if (process.env.INTEGRATION_PM_NAME === 'pnpm') {
        await renameFixture(app, 'destination', 'pnpm-workspace.yaml')
      }

      process.env.SECCO_VERDACCIO_PORT = (await getPort()).toString()
    })

    afterAll(async () => {
      await app.cleanup()
    })

    it('should work (with Verdaccio by default)', () => {
      const [exitCode, logs] = app.cli(['--scan-once'], { verbose: true })

      logs.should.contain('[log] [Verdaccio] Starting server...')
      logs.should.contain('[log] [Verdaccio] Started successfully!')
      logs.should.contain('[log] Publishing `say-hello-world@0.0.2-secco-')
      logs.should.contain('[log] Published `say-hello-world@0.0.2-secco-')
      logs.should.contain(`[debug] Detected package manager in destination: ${app.packageManager.split('@')[0]}`)
      logs.should.contain('[log] Installing packages from local registry:')
      logs.should.contain('[success] Installation finished successfully!')

      expect(exitCode).toBe(0)
    })
  })
})
