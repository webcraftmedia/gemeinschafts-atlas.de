import { test, expect } from '@playwright/test'

/**
 * Das ausgelieferte Artefakt liefert wirklich Seiten aus. Alles andere in der
 * Suite setzt das voraus; scheitert es hier, sind die übrigen Fehler Rauschen.
 */
test.describe('the deployed app', () => {
  test('serves the landing page, server-rendered', async ({ page }) => {
    const response = await page.goto('/')

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gemeinsam statt einsam')
    // Die Überschrift muss im HTML stehen, nicht nachträglich hineingemalt
    // werden: das ist der Unterschied zwischen SSR und einer Client-App, und es
    // ist das, was Suchmaschinen und Textbrowser sehen.
    expect(await response?.text()).toContain('Gemeinsam statt einsam')
  })

  test('describes the project without needing JavaScript', async ({ page }) => {
    const response = await page.goto('/')
    const html = (await response?.text()) ?? ''

    // Die drei Aussagen, um die es geht — server-gerendert, also auch ohne JS da.
    expect(html).toContain('wohnen nicht nur zusammen')
    expect(html).toContain('empfangen Gäste')
    expect(html).toContain('neue Zeit')
  })

  test('declares its language as German', async ({ page }) => {
    await page.goto('/')

    // Ohne lang spricht ein Screenreader deutschen Text mit englischen Phonemen.
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  })

  test('leads from the landing page to the map', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Zur Karte' }).click()

    await expect(page).toHaveURL('/karte')
    // Die Karte selbst braucht WebGL; was hier zählt, ist dass man ankommt —
    // und dass der Weg zum gleichwertigen Angebot von dort aus offen steht.
    // Die Liste liegt seit dem Umbau unter /liste und nicht mehr auf dieser
    // Seite; geprüft wird deshalb der Link, nicht ihre Überschrift.
    await expect(page.getByRole('region', { name: /Karte der Gemeinschaften/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Als Liste', exact: true })).toBeVisible()
  })

  test('shows the drawn village before any JavaScript runs', async ({ page }) => {
    const response = await page.goto('/')
    const html = (await response?.text()) ?? ''

    // Die Zeichnung ist server-gerendert und steht im ausgelieferten HTML.
    // Damit ist die Startseite auch ohne JavaScript nicht leer — und der erste
    // Eindruck hängt nicht daran, ob MapLibre rechtzeitig fertig wird.
    expect(html).toContain('aria-hidden="true"')
    expect(await page.locator('svg[aria-hidden="true"] path').count()).toBeGreaterThan(0)
  })

  test('loads the map after the first paint, not before it', async ({ page }) => {
    await page.goto('/')

    // Der Übergang braucht die echte Karte, und die kostet das Vielfache der
    // ganzen übrigen Seite. `hydrate-on-idle` schiebt sie deshalb hinter den
    // ersten Aufbau: Die Zeichnung steht sofort, MapLibre kommt danach.
    //
    // Geprüft wird die Reihenfolge, nicht eine Millisekunde: Zuerst muss die
    // Überschrift stehen, dann darf MapLibre kommen — und es *muss* kommen,
    // sonst klart beim Scrollen leeres Papier auf statt einer Karte.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForRequest((request) => request.url().includes('maplibre'), {
      timeout: 30_000,
    })
    await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  })

  test('lists every community under its own address, server-rendered', async ({ page }) => {
    const response = await page.goto('/liste')
    const html = (await response?.text()) ?? ''

    // Die Liste ist das gleichwertige Angebot zur Karte, und seit dem Umbau
    // eine eigene Seite. Käme sie erst per JavaScript, wäre sie für einen Teil
    // der Nutzer gar nicht vorhanden — und für Suchmaschinen ist sie das
    // Einzige, was von diesen Daten zu sehen ist.
    expect(html).toContain('Ökodorf Sieben Linden')
    expect(html).toContain('Kommune Niederkaufungen')
  })

  test('offers no map page that is a dead end without JavaScript', async ({ page }) => {
    const response = await page.goto('/karte')
    const html = (await response?.text()) ?? ''

    // Ohne JavaScript gibt es keine Karte. Dann muss der ausgelieferte HTML-Text
    // wenigstens den Weg zum Verzeichnis enthalten — sonst ist die Seite für
    // einen Teil der Nutzer leer, und zwar server-seitig, wo niemand es sieht.
    expect(html).toContain('/liste')
  })

  test('links the imprint to the operator', async ({ page }) => {
    await page.goto('/')

    const imprint = page.getByRole('link', { name: /Impressum/ })
    await expect(imprint).toHaveAttribute('href', 'https://webcraft-media.de/#!impressum')
    await expect(imprint).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('links the privacy policy to the operator', async ({ page }) => {
    await page.goto('/')

    const privacy = page.getByRole('link', { name: /Datenschutz/ })
    await expect(privacy).toHaveAttribute('href', 'https://webcraft-media.de/#!datenschutz')
    await expect(privacy).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('actually renders map tiles, not just a canvas', async ({ page }) => {
    const failed: string[] = []
    const tiles: number[] = []
    page.on('requestfailed', (request) => failed.push(request.url()))
    page.on('response', (response) => {
      if (response.url().includes('.pbf')) tiles.push(response.status())
    })

    await page.goto('/karte')
    await expect(page.locator('.maplibregl-canvas')).toBeVisible()
    await expect(page.locator('.atlas-marker').first()).toBeVisible()
    await page.waitForResponse((response) => response.url().includes('.pbf'), { timeout: 30_000 })

    // Der Grund für diesen Test: Ein vorheriger Stand hatte Canvas *und* Marker,
    // aber keine Karte — MapLibres Worker wurde vom Bundler nie ausgegeben, und
    // ohne ihn dekodiert niemand die Vector Tiles. Ein Test, der nur nach dem
    // Canvas sieht, war grün. Deshalb wird hier das Netz befragt.
    expect(failed).toEqual([])
    expect(tiles.length).toBeGreaterThan(0)
    expect(tiles.every((status) => status === 200)).toBe(true)
  })

  test('answers the health probe', async ({ request }) => {
    const response = await request.get('/api/health')

    expect(response.status()).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'ok' })
  })

  test('has no unhandled console errors on the landing page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto('/')
    // Hydrationsfehler kommen nach dem ersten Paint — der Seite einen Moment geben.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(errors).toEqual([])
  })
})
