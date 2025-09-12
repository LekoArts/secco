import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'pathe'

/**
 * Remove a directory and all its contents.
 */
export async function removeDir(absolutePath: string) {
  await rm(absolutePath, { recursive: true, force: true })
}

/**
 * Create an isolated temporary directory for testing.
 *
 * @returns - A tuple with the absolute path to the temporary directory and a cleanup function to remove it.
 */
export async function createTempDir(name: string) {
  const tempDir = process.env.RUNNER_TEMP || tmpdir()
  const isolatedDir = await mkdtemp(join(tempDir, `secco-${name}-`))

  return [isolatedDir, async () => {
    await removeDir(isolatedDir)
  }] as const
}

/**
 * Validate that at the given absolute path a file exists.
 */
export async function fileExists(absolutePath: string) {
  try {
    await access(absolutePath)
    return true
  }
  catch {
    return false
  }
}

/**
 * Check if a file contains the given text.
 */
export async function fileContainsText(absolutePath: string, text: string) {
  try {
    const fileContent = await readFile(absolutePath, 'utf-8')
    return fileContent.includes(text)
  }
  catch {
    return false
  }
}
