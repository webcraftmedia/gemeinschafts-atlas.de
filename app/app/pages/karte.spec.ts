import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect, vi } from 'vitest'

import { mapLibreStub } from '../../test/helpers/maplibre'

import KartePage from './karte.vue'

import { communities } from '~/data/communities'

// Die Seite bindet die Karte ein, die WebGL braucht. Hier interessiert nur, was
// die Seite zusammensetzt — die Karte selbst hat ihren eigenen Spec.
vi.mock(import('maplibre-gl'), () => mapLibreStub())
// Das Worker-Asset ist ein Vite-Konstrukt (?worker&url) und existiert unter
// vitest nicht — die URL wird gebraucht, aber nie aufgerufen.
vi.mock(import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'), () => ({
  default: '/maplibre-gl-worker.js',
}))
vi.mock(import('maplibre-gl/dist/maplibre-gl.css'), () => ({}))

describe('karte page', () => {
  it('hands every community to the map', async () => {
    const wrapper = await mountSuspended(KartePage)

    // Die Seite ist seit dem Umbau nur noch die Karte — die Liste hat unter
    // /liste eine eigene Adresse. Was hier bleibt, ist die eine Frage, die
    // diese Seite beantworten muss: Bekommt die Karte alle Daten?
    const map = wrapper.findComponent({ name: 'CommunityMap' })
    expect(map.props('communities')).toStrictEqual(communities)
  })

  it('does not carry a second copy of the list', async () => {
    const wrapper = await mountSuspended(KartePage)

    // Zwei Adressen mit demselben Verzeichnis wären zwei Stellen, die
    // auseinanderlaufen können. Der Weg zur Liste steht in der Leiste des
    // Layouts und im Fallback ohne JavaScript — nicht als Kopie hier.
    expect(wrapper.findComponent({ name: 'CommunityList' }).exists()).toBe(false)
  })
})
