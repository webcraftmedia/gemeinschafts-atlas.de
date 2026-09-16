import { describe, it, expect } from 'vitest'

import { communities, GERMANY_BOUNDS } from './communities'

/**
 * Invarianten der Datenquelle. Keine davon prüft, ob ein Eintrag *stimmt* — das
 * kann nur ein Mensch — aber jede fängt einen Fehler, der sonst erst auf der
 * Karte auffällt, und dort als "der Marker ist weg" statt als Ursache.
 */
describe('communities', () => {
  const [[west, south], [east, north]] = GERMANY_BOUNDS

  it('has unique ids', () => {
    // Doppelte ids kollidieren in :key und in den Ankern der Liste.
    const ids = communities.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(communities)('places $name inside Germany', (community) => {
    const [lon, lat] = community.coordinates

    // Der klassische Fehler ist die vertauschte Reihenfolge: [52.7, 11.1] statt
    // [11.1, 52.7] liegt im Indischen Ozean, und MapLibre zeigt einfach nichts
    // an. Die Bounds-Prüfung fängt genau das.
    expect(lon).toBeGreaterThanOrEqual(west)
    expect(lon).toBeLessThanOrEqual(east)
    expect(lat).toBeGreaterThanOrEqual(south)
    expect(lat).toBeLessThanOrEqual(north)
  })

  it.each(communities)('describes what $name is for beyond living there', (community) => {
    // Der Zweck ist der Kern des Atlas — ein Eintrag ohne ihn ist eine Adresse.
    expect(community.purpose.trim().length).toBeGreaterThan(10)
    expect(community.place.trim()).not.toBe('')
  })
})
