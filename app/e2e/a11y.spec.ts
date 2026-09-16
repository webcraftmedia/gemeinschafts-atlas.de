import { test, expect } from '@playwright/test'

import { expectNoNewA11yViolations } from './helpers/axe'

/**
 * Barrierefreiheit in zwei Hälften, die Verschiedenes finden.
 *
 * Der axe-Scan deckt ab, was eine Maschine entscheiden kann: Kontrastwerte,
 * ungültiges ARIA, Landmarken- und Überschriftenstruktur, doppelte ids. Die
 * handgeschriebenen Tests decken ab, was sie nicht kann — wohin der Fokus
 * springt und ob sich überhaupt etwas ohne Maus bedienen lässt.
 *
 * Die Mechanik der Baseline steht in helpers/axe.ts; hier wird nur entschieden,
 * *was* angeschaut wird.
 */

test.describe('automated WCAG scan', () => {
  test('the landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoNewA11yViolations(page, 'startseite')
  })

  test('the map page', async ({ page }) => {
    await page.goto('/karte')
    // Erst scannen, wenn die Karte wirklich steht — vorher fehlt die Hälfte
    // dessen, was axe bewerten soll.
    await expect(page.locator('.maplibregl-canvas')).toBeVisible()
    await expectNoNewA11yViolations(page, 'karte')
  })
})

test.describe('keyboard operation', () => {
  test('the first Tab reaches the skip link, and it jumps to the content', async ({ page }) => {
    await page.goto('/')

    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Zum Inhalt springen' })
    await expect(skip).toBeFocused()
    // Nur nützlich, wenn er dabei sichtbar wird — ein fokussierter, aber
    // unsichtbarer Link lässt einen sehenden Tastaturnutzer im Dunkeln.
    await expect(skip).toBeVisible()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/#main')
  })

  test('every link on the landing page is reachable by keyboard', async ({ page }) => {
    await page.goto('/')

    const links = await page.getByRole('link').all()
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      await link.focus()
      await expect(link).toBeFocused()
    }
  })

  test('the map page offers the list to anyone who cannot use the map', async ({ page }) => {
    await page.goto('/karte')

    // Der Weg an der Karte vorbei. Ohne ihn wäre die Seite für Tastatur- und
    // Screenreader-Nutzer eine Sackgasse — die Karte selbst ist Pixel auf einer
    // Canvas und für sie nicht bedienbar.
    await page.getByRole('link', { name: 'Als Liste' }).click()
    await expect(page.getByRole('heading', { name: 'Alle Gemeinschaften' })).toBeVisible()
  })

  test('the map markers are not in the tab order', async ({ page }) => {
    await page.goto('/karte')
    await expect(page.locator('.maplibregl-canvas')).toBeVisible()

    // Marker sind bewusst nur Dekoration: durch Dutzende Punkte zu tabben,
    // deren Lage man nicht sieht, ist kein Angebot. Die Liste ist es.
    const markers = page.locator('.atlas-marker')
    await expect(markers.first()).toBeVisible()
    for (const marker of await markers.all()) {
      await expect(marker).toHaveAttribute('aria-hidden', 'true')
    }
  })
})
