import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

/**
 * Absolute path to the Nuxt CLI entry point in this project's node_modules.
 *
 * Resolved rather than hard-coded, so it keeps working whether npm hoists the
 * package to the top level or nests it, and so a missing install fails here with
 * a clear message instead of somewhere inside a spawned process.
 */
const require = createRequire(import.meta.url)
export const NUXT_BIN = join(dirname(require.resolve('nuxt/package.json')), 'bin', 'nuxt.mjs')
