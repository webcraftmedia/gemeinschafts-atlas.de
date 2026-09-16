import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'

import AppFooter from './AppFooter.vue'

describe('AppFooter', () => {
  it('links the imprint to the operator, in a new tab', async () => {
    const wrapper = await mountSuspended(AppFooter)

    // § 5 DDG verlangt, dass das Impressum ständig verfügbar und unmittelbar
    // erreichbar ist — der Link muss also da sein und dorthin zeigen, wo die
    // Angaben der Betreiberin wirklich stehen.
    const link = wrapper.get('a[href^="https://webcraft-media.de"]')
    expect(link.attributes('href')).toBe('https://webcraft-media.de/#!impressum')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(link.text()).toContain('Impressum')
  })
})
