import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'

import IndexPage from './index.vue'

describe('index page', () => {
  it('carries the one h1 of the page', async () => {
    const wrapper = await mountSuspended(IndexPage)

    // Genau eine — eine zweite bricht die Gliederung, an der sich Screenreader
    // durch die Seite bewegen.
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Gemeinsam statt einsam')
  })

  it('leads to the map', async () => {
    const wrapper = await mountSuspended(IndexPage)

    // Der eine Weg, den die Startseite anbieten soll.
    expect(wrapper.get('a[href="/karte"]').text()).toBe('Zur Karte')
  })

  it('says what makes these communities more than a housing arrangement', async () => {
    const wrapper = await mountSuspended(IndexPage)

    const text = wrapper.text()
    // Die drei Aussagen, um die es dem Projekt geht. Verschwindet eine bei
    // einem Umbau, ist die Seite hübsch und leer.
    expect(text).toContain('wohnen nicht nur zusammen')
    expect(text).toContain('empfangen Gäste')
    expect(text).toContain('neue Zeit')
  })

  it('structures the three sections as headings', async () => {
    const wrapper = await mountSuspended(IndexPage)

    expect(wrapper.findAll('h2')).toHaveLength(3)
  })
})
