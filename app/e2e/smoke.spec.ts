import { test, expect } from '@playwright/test'

/**
 * The deployed artifact actually serves pages. Everything else in the suite
 * assumes this; if it fails, the other failures are noise.
 */
test.describe('the deployed app', () => {
  test('serves the start page, server-rendered', async ({ page }) => {
    const response = await page.goto('/')

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gemeinschafts-Atlas')
    // The heading has to be in the HTML, not painted in afterwards: that is the
    // difference between SSR and a client-side app, and it is what search
    // engines and text browsers see.
    expect(await response?.text()).toContain('Gemeinschafts-Atlas')
  })

  test('declares its language as German', async ({ page }) => {
    await page.goto('/')

    // Without lang, screen readers pronounce German text with English phonemes.
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  })

  test('navigates to the imprint and back without a full reload', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Impressum' }).click()

    await expect(page).toHaveURL('/impressum')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Impressum')

    await page.getByRole('link', { name: 'Zurück zur Startseite' }).click()
    await expect(page).toHaveURL('/')
  })

  test('answers the health probe', async ({ request }) => {
    const response = await request.get('/api/health')

    expect(response.status()).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'ok' })
  })

  test('has no unhandled console errors on the start page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto('/')
    // Hydration errors are reported after the first paint, so give them a tick.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(errors).toEqual([])
  })
})
