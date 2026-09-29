import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'

import VillageBackdrop from './VillageBackdrop.vue'

/**
 * Ob die Zeichnung schön ist, kann kein Test sagen. Was er sagen kann: dass sie
 * vollständig ist, dass sie mit den Daten wächst und dass sie für Screenreader
 * nicht existiert. Die Geometrie dahinter prüft `utils/village.spec.ts`.
 */
describe('VillageBackdrop', () => {
  it('draws one farmstead per community', async () => {
    const six = await mountSuspended(VillageBackdrop, { props: { count: 6 } })
    const nine = await mountSuspended(VillageBackdrop, { props: { count: 9 } })

    // Die einzige Verbindung zu den Daten: die Anzahl. Kommt eine Gemeinschaft
    // dazu, wächst das Dorf — sonst wäre es ein Bild, das altert.
    expect(six.findAll('[data-farmstead]')).toHaveLength(6)
    expect(nine.findAll('[data-farmstead]')).toHaveLength(9)
  })

  it('leads a way from every farmstead to the green', async () => {
    const wrapper = await mountSuspended(VillageBackdrop, { props: { count: 6 } })

    // Ein Hof ohne Weg wäre ein Gehöft in der Einöde — das Gegenteil dessen,
    // was das Bild sagen soll.
    expect(wrapper.findAll('[data-way]')).toHaveLength(6)
  })

  it('stays out of the accessibility tree', async () => {
    const wrapper = await mountSuspended(VillageBackdrop, { props: { count: 6 } })

    // Schmuck, kein Inhalt: Was das Bild meint, steht als Text daneben. Ein
    // Screenreader, der eine Zeichnung ankündigt, die nichts erklärt,
    // unterbricht nur. `focusable` dazu, weil der IE-Erbe in manchen Engines
    // SVGs sonst in die Tab-Reihenfolge nimmt.
    const svg = wrapper.get('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
  })

  it('points the drawing at the mask it actually defines', async () => {
    const wrapper = await mountSuspended(VillageBackdrop, { props: { count: 6 } })

    // Die id kommt aus Vues `useId`, damit zwei Zeichnungen auf einer Seite
    // nicht dieselbe benutzen — dass das eindeutig ist, ist Vues Sache und
    // nicht hier zu prüfen. Prüfbar ist, ob beide Enden zusammenpassen: Zeigt
    // die Referenz ins Leere, verschwindet die ganze Zeichnung, weil eine
    // fehlende Maske als „nichts sichtbar" gilt.
    const id = wrapper.get('mask').attributes('id')

    expect(wrapper.find(`g[mask="url(#${String(id)})"]`).exists()).toBe(true)
  })
})
