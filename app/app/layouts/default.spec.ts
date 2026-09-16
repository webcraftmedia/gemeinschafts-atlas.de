import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'

import DefaultLayout from './default.vue'

describe('default layout', () => {
  it('provides the main landmark the skip link points at', async () => {
    const wrapper = await mountSuspended(DefaultLayout, {
      slots: { default: () => 'Inhalt' },
    })

    // Der Skip-Link in app.vue zeigt auf #main. Verschwindet die id hier,
    // springt er ins Leere — und niemand merkt es, weil der Link sichtbar bleibt.
    expect(wrapper.get('main').attributes('id')).toBe('main')
    expect(wrapper.get('main').text()).toContain('Inhalt')
  })

  it('carries the footer with the imprint', async () => {
    const wrapper = await mountSuspended(DefaultLayout)

    expect(wrapper.find('footer').exists()).toBe(true)
    expect(wrapper.get('a[href^="https://webcraft-media.de"]').text()).toContain('Impressum')
  })
})
