import type { Application } from '../../models/application'
import { appendFile, readFile } from 'node:fs/promises'
import getPort from 'get-port'
import { join } from 'pathe'
import { renameFixture } from '../../helpers/renamer'
import { presets } from '../../presets'

describe('scan-once', () => {
  describe('single package', () => {
    let app: Application

    beforeAll(async () => {
      app = await presets.kitchenSink.commit()

      process.env.SECCO_VERDACCIO_PORT = (await getPort()).toString()
    })

    afterAll(async () => {
      await app.cleanup()
    })

    it('should run Verdaccio with --force-verdaccio', async () => {
      const [exitCode, logs] = app.cli(['--scan-once', '--force-verdaccio', '--verbose'])

      logs.should.contain('[log] [Verdaccio] Starting server...')
      logs.should.contain('[log] [Verdaccio] Started successfully!')
      logs.should.contain('[log] Publishing `say-hello-world@0.0.2-secco-')
      logs.should.contain('[log] Published `say-hello-world@0.0.2-secco-')
      logs.should.contain(`[debug] Detected package manager in destination: ${app.packageManager.split('@')[0]}`)
      logs.should.contain('[log] Installing packages from local registry:')
      logs.should.contain('[success] Installation finished successfully!')

      expect(exitCode).toBe(0)

      const installedPkg = JSON.parse(await readFile(join(app.dir, 'destination/node_modules/say-hello-world/package.json'), 'utf-8')) as { version: string }
      expect(installedPkg.version).toMatch(/^0\.0\.2-secco-/)
    })

    it('should copy files on consecutive runs', async () => {
      const [exitCode, logs] = app.cli(['--scan-once'], { verbose: true })

      logs.should.not.contain('[log] [Verdaccio] Starting server...')
      logs.should.not.contain('[success] Installation finished successfully!')
      logs.should.contain('[log] Copied `index.mjs` to `node_modules/say-hello-world/index.mjs`')
      logs.should.contain('[log] Copied `package.json` to `node_modules/say-hello-world/package.json`')
      logs.should.contain('[info] Copied 2 files. Exiting...')

      expect(exitCode).toBe(0)

      const [source, copied] = await Promise.all([
        readFile(join(app.dir, 'source/index.mjs'), 'utf-8'),
        readFile(join(app.dir, 'destination/node_modules/say-hello-world/index.mjs'), 'utf-8'),
      ])
      expect(copied).toBe(source)
    })

    it('should copy changed files in watch mode', async () => {
      const watcher = app.watch()
      const copiedFile = join(app.dir, 'destination/node_modules/say-hello-world/index.mjs')

      try {
        await vi.waitFor(() => expect(watcher.getOutput()).toContain('Copied `index.mjs`'), { timeout: 15_000, interval: 100 })

        const marker = `// watch-mode-${Date.now()}`
        await appendFile(join(app.dir, 'source/index.mjs'), `\n${marker}\n`)

        await vi.waitFor(async () => expect(await readFile(copiedFile, 'utf-8')).toContain(marker), { timeout: 15_000, interval: 100 })
      }
      finally {
        await watcher.stop()
      }
    })
  })

  describe('workspaces', () => {
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
