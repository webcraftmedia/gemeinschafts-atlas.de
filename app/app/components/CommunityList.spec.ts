import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'

import CommunityList from './CommunityList.vue'

import { communities } from '~/data/communities'

describe('CommunityList', () => {
  it('lists every community with place and purpose', async () => {
    const wrapper = await mountSuspended(CommunityList, { props: { communities } })

    const items = wrapper.findAll('li')
    expect(items).toHaveLength(communities.length)
    // Die Liste ist das gleichwertige Angebot zur Karte — fehlt hier etwas, ist
    // es für Screenreader-Nutzer schlicht nicht vorhanden.
    for (const [index, community] of communities.entries()) {
      expect(items[index]!.text()).toContain(community.name)
      expect(items[index]!.text()).toContain(community.place)
      expect(items[index]!.text()).toContain(community.purpose)
    }
  })

  it('links each entry to its position on OpenStreetMap', async () => {
    const wrapper = await mountSuspended(CommunityList, { props: { communities } })

    // Unsere Karte zeigt bewusst keine Straßen. Der Weg dorthin ist genau dieser
    // Link — und die Koordinaten müssen in der Reihenfolge stehen, die OSM
    // erwartet (mlat vor mlon), sonst landet man woanders.
    const first = communities[0]!
    const [lon, lat] = first.coordinates
    const href = wrapper.get('a[href*="openstreetmap.org"]').attributes('href')
    expect(href).toContain(`mlat=${String(lat)}`)
    expect(href).toContain(`mlon=${String(lon)}`)
  })

  it('marks communities that take guests', async () => {
    const wrapper = await mountSuspended(CommunityList, { props: { communities } })

    const expected = communities.filter((community) => community.guests).length
    expect(
      wrapper.findAll('li').filter((li) => li.text().includes('Gäste willkommen')),
    ).toHaveLength(expected)
  })

  it('says nothing about guests when a community takes none', async () => {
    const wrapper = await mountSuspended(CommunityList, {
      props: {
        communities: [{ ...communities[0]!, guests: false }],
      },
    })

    expect(wrapper.text()).not.toContain('Gäste willkommen')
  })

  it('brings no heading of its own', async () => {
    const wrapper = await mountSuspended(CommunityList, { props: { communities } })

    // Seit die Liste unter /liste eine eigene Seite hat, gehört die Überschrift
    // dorthin — als h1. Brächte die Komponente eine zweite mit, stünde auf der
    // Seite eine Gliederung mit zwei Einstiegen.
    // Über das gerenderte Markup und nicht über `wrapper.element.tagName`: Der
    // Typ des Wurzelelements ist bei einer Komponente nicht aufzulösen, und ein
    // `any` im Test prüft am Ende weniger als es behauptet.
    expect(wrapper.html()).toMatch(/^<ul/)
    expect(wrapper.findAll('h1')).toHaveLength(0)
  })
})
