import { test, expect } from '@playwright/test'

import { communities } from '../app/data/communities'

import type { Page } from '@playwright/test'

/**
 * Die Zusage der Karte, im echten Browser geprüft: **ganz herausgezoomt sieht
 * man Deutschland.**
 *
 * Die Unit-Tests rechnen nach, ob die Zoomgrenze stimmt. Sie können nicht
 * sehen, was MapLibre daraus macht — und genau dort lag der Fehler: `fitBounds`
 * wurde still übergangen, weil `maxBounds` zu eng war. Am 29.09.2026 lag auf
 * 1440 × 900 eine der sechs Gemeinschaften außerhalb des Bildes, ohne dass
 * irgendein Test oder irgendeine Warnung davon berichtet hätte.
 *
 * Deshalb wird hier nichts instrumentiert und keine Kartenzahl abgefragt,
 * sondern das geprüft, was ein Besucher sieht: wo die Punkte liegen.
 */

const VIEWPORTS = {
  'a laptop': { width: 1440, height: 900 },
  'a phone': { width: 390, height: 844 },
  'an ultrawide window': { width: 2560, height: 1080 },
}

/**
 * Wie lange eine Zoom-Animation braucht, bis man sie ausgelaufen nennen darf.
 * MapLibre rechnet mit 300 ms; der Puffer ist für langsame Maschinen, und für
 * die ganz langsamen gibt es die Variable.
 */
const ZOOM_SETTLE = Number(process.env.E2E_ZOOM_SETTLE ?? 900)

async function openMap(page: Page): Promise<void> {
  await page.goto('/karte')
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  await expect(page.locator('.atlas-marker')).toHaveCount(communities.length)
}

/**
 * Die Punkte als Maß für den Ausschnitt: ihre Spanne in Pixeln wächst und
 * schrumpft mit dem Zoom, ihre Lage verrät, ob einer aus dem Bild fällt.
 */
async function markers(page: Page) {
  const boxes = await Promise.all(
    (await page.locator('.atlas-marker').all()).map(async (marker) => marker.boundingBox()),
  )
  const found = boxes.filter((box) => box !== null)
  expect(found).toHaveLength(communities.length)

  return {
    width: Math.max(...found.map((b) => b.x)) - Math.min(...found.map((b) => b.x)),
    left: Math.min(...found.map((b) => b.x)),
    top: Math.min(...found.map((b) => b.y)),
    right: Math.max(...found.map((b) => b.x + b.width)),
    bottom: Math.max(...found.map((b) => b.y + b.height)),
  }
}

test.describe('fully zoomed out', () => {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`shows every community on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openMap(page)

      // Der Befund von damals in einer Zusicherung: kein Punkt außerhalb des
      // Fensters. Auf 1440 × 900 fiel Sulzbrunn im Allgäu unten heraus.
      const seen = await markers(page)
      expect(seen.left).toBeGreaterThanOrEqual(0)
      expect(seen.top).toBeGreaterThanOrEqual(0)
      expect(seen.right).toBeLessThanOrEqual(viewport.width)
      expect(seen.bottom).toBeLessThanOrEqual(viewport.height)
    })
  }

  test('is where the map already stands when it opens', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS['a laptop'])
    await openMap(page)
    const start = await markers(page)

    // Gegenprobe zum Test darüber: „alle Punkte im Bild" wäre auch von einer
    // Karte zu haben, die weit draußen über Europa steht. Hineinzoomen muss
    // also gehen — und herauszoomen darf nicht mehr gehen.
    await page.locator('.maplibregl-ctrl-zoom-in').click()
    await expect.poll(async () => (await markers(page)).width).toBeGreaterThan(start.width + 1)

    await page.locator('.maplibregl-ctrl-zoom-out').click()
    await expect.poll(async () => (await markers(page)).width).toBeLessThan(start.width + 1)

    // `force`, weil MapLibre den Knopf am Anschlag mal deaktiviert und mal
    // nicht — auf 2560 × 1080 blieb er aktiv, bewirkte aber nichts. Geprüft
    // wird die Wirkung, nicht der Zustand des Knopfes.
    await page.locator('.maplibregl-ctrl-zoom-out').click({ force: true })
    await page.waitForTimeout(ZOOM_SETTLE)
    expect((await markers(page)).width).toBeCloseTo(start.width, 0)
  })

  test('keeps Germany in view after the window is resized', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS['a laptop'])
    await openMap(page)

    // Ein gedrehtes Telefon, ein aufgezogenes Fenster, eine ein- und
    // ausfahrende Adressleiste: dasselbe Ereignis. Eine einmal gesetzte
    // Zoomgrenze stimmt danach nicht mehr.
    await page.setViewportSize({ width: 600, height: 1000 })

    await expect
      .poll(async () => {
        const seen = await markers(page)
        return seen.left >= 0 && seen.top >= 0 && seen.right <= 600 && seen.bottom <= 1000
      })
      .toBe(true)
  })
})
