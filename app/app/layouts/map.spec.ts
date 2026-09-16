import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'

import MapLayout from './map.vue'

describe('map layout', () => {
  it('provides the main landmark the skip link points at', async () => {
    const wrapper = await mountSuspended(MapLayout, { slots: { default: () => 'Karte' } })

    expect(wrapper.get('main').attributes('id')).toBe('main')
  })

  it('offers a way back home and a way to the list', async () => {
    const wrapper = await mountSuspended(MapLayout)

    // Die Karte füllt den Bildschirm; ohne diese beiden Links ist sie eine
    // Sackgasse — besonders für Tastaturnutzer, die die Karte selbst nicht
    // bedienen können.
    expect(wrapper.get('a[href="/"]').text()).toBe('Gemeinschafts-Atlas')
    expect(wrapper.get('a[href="#liste"]').text()).toBe('Als Liste')
  })

  it('lets pointer events through the empty parts of the floating bar', async () => {
    const wrapper = await mountSuspended(MapLayout)

    // Die Leiste liegt über der Karte. Ohne pointer-events-none fängt sie das
    // Ziehen ab und die oberen ~60 px der Karte wären tot.
    expect(wrapper.get('header').classes()).toContain('pointer-events-none')
    expect(wrapper.get('a[href="/"]').classes()).toContain('pointer-events-auto')
  })
})
