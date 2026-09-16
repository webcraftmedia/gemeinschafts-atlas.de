import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import type { Page } from '@playwright/test'
import type { Result } from 'axe-core'

/**
 * Automated WCAG scan with a ratcheting baseline.
 *
 * Why a baseline instead of demanding zero: a single colour decision or a
 * third-party widget can block every unrelated change, and a gate that blocks
 * everything gets switched off. The baseline records the violations that exist
 * today; a rule that is not in it fails the build. It is a floor that only moves
 * down — fixing a rule makes the test fail too, asking for the entry to be
 * dropped, exactly like the coverage ratchet in vitest.config.ts.
 *
 * Why the baseline keys on rule ids and not on individual nodes: axe reports one
 * node per offending element, so a contrast problem in a list shows up once per
 * item — and the count then moves with the fixtures rather than with the code.
 * Rule ids are stable against both. The full node list (selectors and HTML) is
 * attached to the Playwright report, so fixing still has addresses to work from.
 *
 * Why this is not the whole a11y story: axe cannot press Escape, cannot tell
 * where focus went and cannot measure a touch target. Those need handwritten
 * assertions — see e2e/a11y.spec.ts.
 *
 * Refresh after an intended change:
 *   npm run test:e2e:a11y:update
 */

const BASELINE_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'a11y-baseline.json')

/**
 * WCAG 2.0/2.1/2.2 level A and AA — the normative set, and the bar the BFSG
 * applies. `best-practice` is deliberately left out: those rules are advice,
 * not conformance, and would fill the baseline with noise.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const UPDATING = !!process.env.A11Y_UPDATE_BASELINE

type Baseline = Record<string, string[]>

async function readBaseline(): Promise<Baseline> {
  let raw: string
  try {
    raw = await readFile(BASELINE_PATH, 'utf8')
  } catch (error) {
    // Absent on the very first run; A11Y_UPDATE_BASELINE=1 creates it. Anything
    // else — no permission, a directory in its place — must stay loud: silently
    // treating it as "no baseline" would turn the gate off without telling anyone.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw error
  }
  return JSON.parse(raw) as Baseline
}

/**
 * Rewrites one view's entry and leaves the rest alone. A view that came out
 * clean drops out of the file entirely.
 */
async function writeBaseline(view: string, rules: string[]): Promise<void> {
  const entries = Object.entries(await readBaseline()).filter(([key]) => key !== view)
  if (rules.length) entries.push([view, rules])
  entries.sort(([a], [b]) => a.localeCompare(b))
  await writeFile(BASELINE_PATH, `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`)
}

/** Human-readable detail for the report: what failed, where, and how to fix it. */
function describeViolations(violations: Result[]): string {
  return violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `      - ${n.target.join(' ')}`).join('\n')
      return `  ${v.id} (${v.impact ?? 'n/a'}, ${String(v.nodes.length)}×)\n    ${v.help}\n    ${v.helpUrl}\n${nodes}`
    })
    .join('\n\n')
}

/**
 * Scans whatever is currently on screen and compares the set of failing rules
 * against the baseline entry for `view`.
 */
export async function expectNoNewA11yViolations(page: Page, view: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const found = [...new Set(results.violations.map((v) => v.id))].sort()

  // The detail never gates anything, but it is what makes a failure fixable.
  await test
    .info()
    .attach(`axe-${view}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    })
    .catch(() => {})

  if (UPDATING) {
    await writeBaseline(view, found)
    // eslint-disable-next-line no-console
    console.log(`[a11y] ${view}: ${found.length ? found.join(', ') : 'clean'}`)
    return
  }

  const accepted = (await readBaseline())[view] ?? []
  const regressions = found.filter((id) => !accepted.includes(id))
  const resolved = accepted.filter((id) => !found.includes(id))

  expect(
    regressions,
    `New accessibility violations on "${view}":\n\n${describeViolations(
      results.violations.filter((v) => regressions.includes(v.id)),
    )}\n\nFix them, or — with a reason — accept them via npm run test:e2e:a11y:update.`,
  ).toEqual([])

  // The floor only moves down: a rule that no longer fires has to leave the
  // baseline, otherwise it would silently cover a later regression again.
  expect(
    resolved,
    `Fixed on "${view}" — drop from e2e/a11y-baseline.json via npm run test:e2e:a11y:update.`,
  ).toEqual([])
}
