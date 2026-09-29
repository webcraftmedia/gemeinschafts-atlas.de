import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect, vi } from 'vitest'

import { mapLibreStub } from '../../test/helpers/maplibre'

import IndexPage from './index.vue'

import { communities } from '~/data/communities'

// Die Startseite trägt die Karte, und die braucht WebGL. Hier interessiert nur,
// was die Seite zusammensetzt; die Karte hat ihren eigenen Spec.
vi.mock(import('maplibre-gl'), () => mapLibreStub())
vi.mock(import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'), () => ({
  default: '/maplibre-gl-worker.js',
}))
vi.mock(import('maplibre-gl/dist/maplibre-gl.css'), () => ({}))

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

    // Der Weg für alle, die nicht scrollen wollen oder können — und für die
    // Tastatur der einzige.
    expect(wrapper.get('a[href="/karte"]').text()).toContain('Zur Karte')
  })

  it('draws the village behind the words, one farmstead per community', async () => {
    const wrapper = await mountSuspended(IndexPage)

    // Das Bild ist erfunden, aber nicht beliebig: Es zählt die Gemeinschaften.
    // Käme es aus einer Datei, liefe es beim nächsten neuen Eintrag auseinander.
    const backdrop = wrapper.findComponent({ name: 'VillageBackdrop' })
    expect(backdrop.exists()).toBe(true)
    expect(backdrop.props('count')).toBe(communities.length)
  })

  it('lays the real map under the drawing, ready to be revealed', async () => {
    const wrapper = await mountSuspended(IndexPage)

    // Beide Ebenen liegen im selben klebenden Rahmen — das ist die Bedingung
    // dafür, dass der Übergang ein Auflösen ist und kein Seitenwechsel.
    const map = wrapper.findComponent({ name: 'CommunityMap' })
    expect(map.exists()).toBe(true)
    expect(map.props('communities')).toStrictEqual(communities)
    // Ohne das fängt die bildschirmfüllende Karte das Mausrad ab, und die Seite
    // hört für den Besucher an ihrem oberen Rand auf.
    expect(map.props('cooperativeGestures')).toBe(true)
  })

  it('names how many communities there are', async () => {
    const wrapper = await mountSuspended(IndexPage)

    expect(wrapper.text()).toContain(`${String(communities.length)} Gemeinschaften`)
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

    // Auf `article` eingegrenzt: Die Liste am Seitenende bringt ihre eigene h2
    // mit, und die zählt hier nicht mit.
    expect(wrapper.findAll('article h2')).toHaveLength(3)
  })

  it('shows the explanation openly, not behind a trigger', async () => {
    const wrapper = await mountSuspended(IndexPage)

    // Wer nach dem Übergang weiterscrollt, liest weiter — ohne erst etwas
    // aufklappen zu müssen. Dass hier kein `<details>` mehr steht, ist eine
    // Entscheidung und kein Versehen.
    expect(wrapper.find('details').exists()).toBe(false)
    expect(wrapper.findAll('article')).toHaveLength(3)
  })

  it('carries the list for everyone the map does not serve', async () => {
    const wrapper = await mountSuspended(IndexPage)

    // Eine Canvas ist für Tastatur und Screenreader nichts. Die Liste ist kein
    // Anhang, sondern das gleichwertige Angebot — und sie steht wieder auf der
    // Seite selbst, nicht nur eine Adresse weiter.
    const list = wrapper.findComponent({ name: 'CommunityList' })
    expect(list.props('communities')).toStrictEqual(communities)
    // Die Überschrift gehört zur Seite, nicht zur Komponente: hier eine h2,
    // auf /liste eine h1.
    expect(wrapper.get('#liste h2').text()).toBe('Alle Gemeinschaften')
  })
})
