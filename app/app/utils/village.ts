/**
 * Die Geometrie des gezeichneten Dorfes.
 *
 * Kein Ort auf einer Landkarte, sondern ein Bild: Höfe in einem lockeren Ring
 * um einen gemeinsamen Anger, Wege dazwischen. Was hier gerechnet wird, ist nur
 * das, was sich mit der Zahl der Gemeinschaften ändert — Anger, Teich, Felder
 * und Obstwiesen sind gezeichnet und stehen im Template von
 * `VillageBackdrop.vue`. Eine Zeichnung, die vollständig aus Formeln kommt,
 * sieht am Ende auch so aus.
 *
 * Alles hier ist rein und wiederholbar. Das ist keine Stilfrage: Die Seite wird
 * auf dem Server gerendert und im Browser hydratisiert, und käme dabei zweimal
 * ein anderes Dorf heraus, meldete Vue eine Hydrations-Abweichung und der
 * Besucher sähe das Bild springen. Deshalb gibt es hier auch kein `Math.random`.
 */

/** Der Zeichenraum, in dem alles liegt — Seitenverhältnis des `viewBox`. */
export const VILLAGE_VIEWBOX = { width: 1100, height: 700 }

/** Wo der Ring der Höfe liegt und wie weit der Anger in seiner Mitte reicht. */
export interface VillageRing {
  /** Mittelpunkt des Angers. */
  cx: number
  cy: number
  /** Halbachsen des Rings, auf dem die Höfe stehen. */
  rx: number
  ry: number
  /** Halbachsen des Angers — dort enden die Wege. */
  greenRx: number
  greenRy: number
}

export const VILLAGE_RING: VillageRing = {
  cx: 550,
  cy: 350,
  rx: 330,
  ry: 190,
  greenRx: 150,
  greenRy: 92,
}

export interface Farmstead {
  x: number
  y: number
  /** Leichte Drehung in Grad, damit die Höfe nicht wie gestempelt dastehen. */
  tilt: number
}

/**
 * Wiederholbares Rauschen aus einer ganzen Zahl, Ergebnis zwischen 0 und 1.
 *
 * Der Sinus-Trick ist kein guter Zufallsgenerator und soll auch keiner sein: Er
 * braucht keinen Zustand, liefert auf jedem Gerät dieselbe Zahl und reicht
 * vollkommen, um eine Handvoll Häuser aus dem Raster zu rücken.
 */
function noise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

/** Auf eine Nachkommastelle — das reicht fürs Auge und hält das SVG klein. */
function round(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * Die Höfe, gleichmäßig auf dem Ring verteilt und dann aus der Reihe gerückt.
 *
 * Der erste steht oben. Die Abweichung ist bewusst klein — so viel, dass kein
 * Kreis mehr zu erkennen ist, und so wenig, dass keine Lücke entsteht, in der
 * das Dorf auseinanderfällt.
 */
export function farmsteads(count: number, ring: VillageRing): Farmstead[] {
  const step = (2 * Math.PI) / count

  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + index * step + (noise(index) - 0.5) * step * 0.4
    // Nicht alle gleich weit draußen: ein paar rücken näher an den Anger.
    const reach = 0.86 + noise(index + 100) * 0.26

    return {
      x: round(ring.cx + Math.cos(angle) * ring.rx * reach),
      y: round(ring.cy + Math.sin(angle) * ring.ry * reach),
      tilt: round((noise(index + 200) - 0.5) * 14),
    }
  })
}

/**
 * Der Weg von einem Hof zum Anger, als SVG-Pfad.
 *
 * Eine Kurve und keine Gerade: Ein Trampelpfad geht um etwas herum, und eine
 * Speiche mehr hätte das Bild zum Wagenrad gemacht.
 */
export function pathToGreen(stead: Farmstead, ring: VillageRing, index: number): string {
  const angle = Math.atan2(stead.y - ring.cy, stead.x - ring.cx)
  const toX = round(ring.cx + Math.cos(angle) * ring.greenRx)
  const toY = round(ring.cy + Math.sin(angle) * ring.greenRy)

  // Der Kontrollpunkt sitzt quer zur Laufrichtung — dadurch bauchen die Wege
  // mal nach links und mal nach rechts aus, statt alle in dieselbe Richtung.
  const bend = (noise(index + 300) - 0.5) * 110
  const midX = round((stead.x + toX) / 2 - Math.sin(angle) * bend)
  const midY = round((stead.y + toY) / 2 + Math.cos(angle) * bend)

  return `M${String(stead.x)} ${String(stead.y)} Q${String(midX)} ${String(midY)} ${String(toX)} ${String(toY)}`
}
