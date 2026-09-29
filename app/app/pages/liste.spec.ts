import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'

import ListePage from './liste.vue'

import { communities } from '~/data/communities'

describe('liste page', () => {
  it('carries the one h1 of the page', async () => {
    const wrapper = await mountSuspended(ListePage)

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Alle Gemeinschaften')
  })

  it('shows every community', async () => {
    const wrapper = await mountSuspended(ListePage)

    // Diese Seite ist das gleichwertige Angebot zur Karte. Fehlt hier ein
    // Eintrag, ist er für Tastatur und Screenreader nirgends.
    const list = wrapper.findComponent({ name: 'CommunityList' })
    expect(list.props('communities')).toStrictEqual(communities)
    for (const community of communities) {
      expect(wrapper.text()).toContain(community.name)
    }
  })

  it('leads back to the map', async () => {
    const wrapper = await mountSuspended(ListePage)

    // Beide Richtungen müssen gehen: Die Karte verweist auf die Liste, und wer
    // hier landet, kommt ohne Zurück-Taste wieder hinüber.
    expect(wrapper.get('a[href="/karte"]').text()).toContain('Zur Karte')
  })
})
