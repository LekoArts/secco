import type { Application } from '../models/application'
import fs from 'fs-extra'
import { join } from 'pathe'

export async function renamePnpmWorkspaceFixture(app: Application) {
  const fixture = join(app.dir, 'destination', 'fixture.pnpm-workspace.yaml')
  const tmpWorkspaceYaml = join(app.dir, 'destination', 'pnpm-workspace.yaml')

  await fs.rename(fixture, tmpWorkspaceYaml)
}
