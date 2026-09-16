import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'

import AppLink from './AppLink.vue'

/**
 * The three link shapes. Each branch has a consequence a reader cannot see from
 * the markup: an internal link that renders as a plain <a> loses client-side
 * navigation, an external one without rel="noopener" hands the opened page a
 * handle on this one, and a mailto: in a new tab leaves a blank tab behind.
 */
describe('AppLink', () => {
  it('renders an internal path as a NuxtLink', async () => {
    const wrapper = await mountSuspended(AppLink, {
      props: { to: '/impressum' },
      slots: { default: () => 'Impressum' },
    })

    expect(wrapper.findComponent({ name: 'NuxtLink' }).exists()).toBe(true)
    expect(wrapper.get('a').attributes('href')).toBe('/impressum')
    expect(wrapper.get('a').attributes('target')).toBeUndefined()
  })

  it('opens an external page in a new tab, safely and audibly', async () => {
    const wrapper = await mountSuspended(AppLink, {
      props: { to: 'https://example.org' },
      slots: { default: () => 'Beispiel' },
    })

    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('https://example.org')
    expect(link.attributes('target')).toBe('_blank')
    // Without noopener the opened document can navigate this one via window.opener.
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    // The tab change has to be announced, or it only surprises screen-reader users.
    expect(wrapper.get('.sr-only').text()).toBe('(öffnet in einem neuen Tab)')
  })

  it.each(['mailto:kontakt@example.org', 'tel:+4970111223344'])(
    'keeps %s in the same tab',
    async (to) => {
      const wrapper = await mountSuspended(AppLink, {
        props: { to },
        slots: { default: () => 'Kontakt' },
      })

      const link = wrapper.get('a')
      expect(link.attributes('href')).toBe(to)
      expect(link.attributes('target')).toBeUndefined()
      expect(link.attributes('rel')).toBeUndefined()
      expect(wrapper.find('.sr-only').exists()).toBe(false)
    },
  )
})
