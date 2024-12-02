import type { Application } from '../models/application'
import fs from 'fs-extra'
import { join } from 'pathe'

export async function renamePnpmWorkspaceFixture(app: Application, folder: 'destination' | 'source') {
  const fixture = join(app.dir, folder, 'fixture.pnpm-workspace.yaml')
  const tmpWorkspaceYaml = join(app.dir, folder, 'pnpm-workspace.yaml')

  await fs.rename(fixture, tmpWorkspaceYaml)
}
