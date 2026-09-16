import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { describe, it, expect } from 'vitest'

import { paperAndInkStyle } from './mapStyle'

const OPTIONS = {
  tilesUrl: 'https://tiles.example.org/planet',
  glyphsUrl: 'https://tiles.example.org/fonts/{fontstack}/{range}.pbf',
}

/** Der Style ist ein reines Ergebnis seiner Optionen — einmal bauen genügt. */
const style = paperAndInkStyle(OPTIONS)

/**
 * Der Style ist Konfiguration, die zur Laufzeit im Browser interpretiert wird —
 * ein Tippfehler in einem Property-Namen fällt sonst erst als stumm fehlende
 * Ebene auf. `validateStyleMin` ist derselbe Validator, den MapLibre intern
 * benutzt; das hier ist also kein Nachbau der Spezifikation, sondern sie selbst.
 */
describe('paperAndInkStyle', () => {
  it('is a valid MapLibre style', () => {
    expect(validateStyleMin(style)).toStrictEqual([])
  })

  it('takes the tile and glyph endpoints from its options', () => {
    // Beide sind konfigurierbar, damit ein Wechsel auf selbst gehostete Kacheln
    // eine URL-Änderung bleibt — dieser Test hält fest, dass sie wirklich
    // durchgereicht werden und nicht doch irgendwo hartkodiert sind.
    expect(style.sources.openmaptiles).toMatchObject({ url: OPTIONS.tilesUrl })
    expect(style.glyphs).toBe(OPTIONS.glyphsUrl)
  })

  it('credits OpenStreetMap on the source', () => {
    // ODbL-Pflicht. Am Source, weil MapLibres AttributionControl nur dort liest.
    const source = style.sources.openmaptiles

    expect('attribution' in source && source.attribution).toContain('OpenStreetMap')
  })

  it('draws no buildings, roads or points of interest', () => {
    // Die Karte soll zeigen, wo die Gemeinschaften sind. Alles, was mit den
    // Markern um Aufmerksamkeit konkurriert, gehört nicht hinein — und jede
    // weggelassene Ebene ist gesparte Renderlast.
    const sourceLayers = style.layers.map((layer) =>
      'source-layer' in layer ? layer['source-layer'] : undefined,
    )

    expect(sourceLayers).not.toContain('building')
    expect(sourceLayers).not.toContain('transportation')
    expect(sourceLayers).not.toContain('poi')
  })

  it('keeps the country border stronger than the state borders', () => {
    // Die Landesgrenze trägt die Zeichnung. Kippt das Verhältnis, zerfällt das
    // Kartenbild in sechzehn gleichwertige Flecken.
    const country = style.layers.find((layer) => layer.id === 'boundary-country')
    const state = style.layers.find((layer) => layer.id === 'boundary-state')

    expect(country).toBeDefined()
    expect(state).toBeDefined()
    // Gestrichelt ist nur die Binnengrenze.
    expect(state?.type === 'line' && state.paint?.['line-dasharray']).toBeDefined()
    expect(country?.type === 'line' && country.paint?.['line-dasharray']).toBeUndefined()
  })
})
