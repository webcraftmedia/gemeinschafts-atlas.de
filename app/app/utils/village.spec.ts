import { describe, it, expect } from 'vitest'

import { farmsteads, pathToGreen, VILLAGE_RING, VILLAGE_VIEWBOX } from './village'

/**
 * Geprüft wird nicht, ob die Zeichnung schön ist — das kann nur ein Mensch.
 * Geprüft wird, dass sie *dieselbe bleibt* und im Bild liegt: Das eine ist die
 * Bedingung dafür, dass Server und Browser dasselbe Dorf rendern, das andere
 * dafür, dass kein Hof halb außerhalb des viewBox klebt.
 */
describe('farmsteads', () => {
  it('places one per community', () => {
    expect(farmsteads(6, VILLAGE_RING)).toHaveLength(6)
    expect(farmsteads(1, VILLAGE_RING)).toHaveLength(1)
  })

  it('draws the same village twice', () => {
    // Die Seite wird auf dem Server gerendert und im Browser hydratisiert.
    // Käme dabei ein anderes Dorf heraus, meldete Vue eine Abweichung und das
    // Bild spränge beim Laden.
    expect(farmsteads(6, VILLAGE_RING)).toStrictEqual(farmsteads(6, VILLAGE_RING))
  })

  it('keeps every farmstead inside the drawing', () => {
    // Mit Rand: Das Hofzeichen wird um seinen Mittelpunkt gezeichnet und ist
    // rund 60 Einheiten breit.
    const margin = 60

    for (const stead of farmsteads(12, VILLAGE_RING)) {
      expect(stead.x).toBeGreaterThan(margin)
      expect(stead.x).toBeLessThan(VILLAGE_VIEWBOX.width - margin)
      expect(stead.y).toBeGreaterThan(margin)
      expect(stead.y).toBeLessThan(VILLAGE_VIEWBOX.height - margin)
    }
  })

  it('keeps them clear of the green in the middle', () => {
    // Ein Hof auf dem Anger wäre kein Dorf mehr, sondern ein Flecken. Gemessen
    // in Ellipsen-Einheiten: außerhalb heißt, die Summe der normierten
    // Quadrate ist größer als eins.
    for (const stead of farmsteads(6, VILLAGE_RING)) {
      const dx = (stead.x - VILLAGE_RING.cx) / VILLAGE_RING.greenRx
      const dy = (stead.y - VILLAGE_RING.cy) / VILLAGE_RING.greenRy
      expect(dx * dx + dy * dy).toBeGreaterThan(1)
    }
  })

  it('breaks the ring it is built from', () => {
    // Ohne die Abweichung stünden die Höfe auf einem Kreis, und das Bild sähe
    // gestempelt aus. Der Abstand zur Mitte darf deshalb nicht bei allen
    // gleich sein.
    const reaches = farmsteads(6, VILLAGE_RING).map((stead) =>
      Math.hypot(stead.x - VILLAGE_RING.cx, stead.y - VILLAGE_RING.cy),
    )

    expect(new Set(reaches.map((value) => Math.round(value))).size).toBeGreaterThan(1)
  })

  it('tilts the houses a little, but not off their feet', () => {
    for (const stead of farmsteads(6, VILLAGE_RING)) {
      expect(Math.abs(stead.tilt)).toBeLessThanOrEqual(7)
    }
  })
})

describe('pathToGreen', () => {
  const steads = farmsteads(6, VILLAGE_RING)

  it('starts at the farmstead and ends on the green', () => {
    const stead = steads[0]!
    const path = pathToGreen(stead, VILLAGE_RING, 0)

    expect(path.startsWith(`M${String(stead.x)} ${String(stead.y)}`)).toBe(true)

    // Der Endpunkt ist das letzte Koordinatenpaar des Pfades.
    const [x, y] = path.split(' ').slice(-2).map(Number) as [number, number]
    const dx = (x - VILLAGE_RING.cx) / VILLAGE_RING.greenRx
    const dy = (y - VILLAGE_RING.cy) / VILLAGE_RING.greenRy
    expect(Math.hypot(dx, dy)).toBeCloseTo(1, 1)
  })

  it('bends, instead of running straight to the middle', () => {
    // Sechs Geraden auf einen Punkt wären ein Wagenrad, kein Dorf. Der
    // Kontrollpunkt muss also neben der Verbindungslinie liegen.
    const stead = steads[1]!
    const path = pathToGreen(stead, VILLAGE_RING, 1)
    const [midX, midY] = path.split('Q')[1]!.split(' ').slice(0, 2).map(Number) as [number, number]
    const [toX, toY] = path.split(' ').slice(-2).map(Number) as [number, number]

    const straightX = (stead.x + toX) / 2
    const straightY = (stead.y + toY) / 2
    expect(Math.hypot(midX - straightX, midY - straightY)).toBeGreaterThan(1)
  })

  it('draws the same path twice', () => {
    expect(pathToGreen(steads[2]!, VILLAGE_RING, 2)).toBe(pathToGreen(steads[2]!, VILLAGE_RING, 2))
  })
})
