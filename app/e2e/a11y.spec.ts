import { test, expect } from '@playwright/test'

import { expectNoNewA11yViolations } from './helpers/axe'

/**
 * Accessibility, in two halves that find disjoint things.
 *
 * The axe scan below covers what a machine can decide: contrast ratios, invalid
 * ARIA, landmark and heading structure, duplicate ids. The handwritten tests
 * cover what it cannot — where the keyboard focus actually goes, and whether a
 * control can be reached without a mouse at all.
 *
 * The mechanics of the baseline live in helpers/axe.ts; this file only decides
 * *what* gets looked at.
 */

test.describe('automated WCAG scan', () => {
  test('the start page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoNewA11yViolations(page, 'startseite')
  })

  test('the imprint', async ({ page }) => {
    await page.goto('/impressum')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoNewA11yViolations(page, 'impressum')
  })
})

test.describe('keyboard operation', () => {
  test('the first Tab reaches the skip link, and it jumps to the content', async ({ page }) => {
    await page.goto('/')

    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Zum Inhalt springen' })
    await expect(skip).toBeFocused()
    // Only useful if it becomes visible — a focused but invisible link leaves a
    // sighted keyboard user with no idea where they are.
    await expect(skip).toBeVisible()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/#main')
  })

  test('every link on the start page is reachable by keyboard', async ({ page }) => {
    await page.goto('/')

    const links = await page.getByRole('link').all()
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      await link.focus()
      await expect(link).toBeFocused()
    }
  })
})
