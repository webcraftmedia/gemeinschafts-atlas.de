import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'

import HomeLayout from './home.vue'

describe('home layout', () => {
  it('provides the main landmark the skip link points at', async () => {
    const wrapper = await mountSuspended(HomeLayout, {
      slots: { default: () => 'Inhalt' },
    })

    // Der Skip-Link in app.vue zeigt auf #main. Verschwindet die id hier,
    // springt er ins Leere — und niemand merkt es, weil der Link sichtbar bleibt.
    expect(wrapper.get('main').attributes('id')).toBe('main')
    expect(wrapper.get('main').text()).toContain('Inhalt')
  })

  it('constrains nothing, so the map stage can span the window', async () => {
    const wrapper = await mountSuspended(HomeLayout, {
      slots: { default: () => 'Inhalt' },
    })

    // Der einzige Unterschied zu `default` — und der Grund, warum es dieses
    // Layout gibt. Eine Spaltenbreite hier, und die klebende Karte säße in
    // einer 42rem breiten Röhre.
    expect(wrapper.get('main').classes()).not.toContain('max-w-2xl')
  })

  it('carries the footer with the imprint', async () => {
    const wrapper = await mountSuspended(HomeLayout)

    expect(wrapper.find('footer').exists()).toBe(true)
    expect(wrapper.get('a[href^="https://webcraft-media.de"]').text()).toContain('Impressum')
  })
})
