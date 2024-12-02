import type { Application } from '../models/application'
import fs from 'fs-extra'
import { join } from 'pathe'

type Autocomplete<U extends T, T = string> = U | (T & Record<never, never>)

export async function renameFixture(app: Application, folder: Autocomplete<'destination' | 'source'>, filename: string) {
  const fixture = join(app.dir, folder, `fixture.${filename}`)
  const tmpWorkspaceYaml = join(app.dir, folder, filename)

  await fs.rename(fixture, tmpWorkspaceYaml)
}
