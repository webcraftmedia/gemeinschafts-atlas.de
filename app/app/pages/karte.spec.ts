import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect, vi } from 'vitest'

import KartePage from './karte.vue'

import { communities } from '~/data/communities'

// Die Seite bindet die Karte ein, die WebGL braucht. Hier interessiert nur, was
// die Seite zusammensetzt — die Karte selbst hat ihren eigenen Spec.
// `function`, nicht Pfeilfunktion — die Komponente ruft sie mit `new` auf.
vi.mock(import('maplibre-gl'), () => {
  const marker = {
    setLngLat: () => marker,
    setPopup: () => marker,
    addTo: () => marker,
  }
  return {
    Map: vi.fn(function () {
      return { addControl: vi.fn(), remove: vi.fn() }
    }),
    Marker: vi.fn(function () {
      return marker
    }),
    Popup: vi.fn(function () {
      return { setDOMContent: () => ({}) }
    }),
    NavigationControl: vi.fn(function () {
      return {}
    }),
  }
})
vi.mock(import('maplibre-gl/dist/maplibre-gl.css'), () => ({}))

describe('karte page', () => {
  it('shows the list alongside the map', async () => {
    const wrapper = await mountSuspended(KartePage)

    // Ohne die Liste wäre die Seite für Tastatur und Screenreader leer — sie
    // ist kein Anhang, sondern der zugängliche Teil des Angebots.
    expect(wrapper.find('#liste').exists()).toBe(true)
    for (const community of communities) {
      expect(wrapper.text()).toContain(community.name)
    }
  })

  it('hands the same data to map and list', async () => {
    const wrapper = await mountSuspended(KartePage)

    // Zwei Darstellungen einer Quelle. Liefe die Liste auf anderen Daten als die
    // Karte, wäre sie kein gleichwertiges Angebot mehr, sondern ein zweites.
    const list = wrapper.findComponent({ name: 'CommunityList' })
    expect(list.props('communities')).toStrictEqual(communities)
  })
})
