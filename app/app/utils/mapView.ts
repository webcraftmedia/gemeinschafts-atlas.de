/**
 * Wie weit die Karte herauszoomen darf.
 *
 * „Ganz herausgezoomt" soll heißen: Deutschland ist im Bild. Welche Zoomstufe
 * das ist, hängt vom Fenster ab — ein Handy im Hochformat braucht eine andere
 * Zahl als ein breiter Monitor. Deshalb steht hier eine Rechnung und keine
 * Konstante; eine feste `minZoom` ist auf genau einem Seitenverhältnis richtig.
 *
 * Bewusst ohne MapLibre: die Bibliothek braucht WebGL und ein DOM, diese
 * Rechnung nicht. So lässt sie sich gegen nachgerechnete Werte prüfen statt
 * gegen einen Mock — und der Fehler, um den es geht, war ein Rechenfehler.
 */

/** Kachelkante in Pixeln. MapLibres Bezugsgröße: Weltbreite = 512 · 2^Zoom. */
const TILE_SIZE = 512

/**
 * Luft zwischen Kartenrand und Land, in Pixeln.
 *
 * Steht hier und nicht an der Karte, weil zwei Stellen dieselbe Zahl brauchen:
 * der Einpass-Aufruf und die Zoom-Untergrenze. Liefen sie auseinander, ließe
 * sich aus dem Startausschnitt noch ein Stück herauszoomen — oder eben nicht
 * ganz bis zu ihm zurück.
 */
export const MAP_PADDING = 24

/** Ein Rechteck in WGS84, [[West, Süd], [Ost, Nord]]. */
export type Bounds = readonly [readonly [number, number], readonly [number, number]]

/** Die Größe des Kartenfensters in CSS-Pixeln. */
export interface ViewportSize {
  width: number
  height: number
}

/**
 * Die letzte Breite, die Mercator noch abbildet. Der Pol liegt unendlich weit
 * außen; jede Rechnung, die dorthin läuft, muss vorher aufhören.
 */
const MERCATOR_LIMIT = 85.051129

/**
 * Web-Mercator-Y, normiert auf 0…1 (Nordpol Richtung 0, Südpol Richtung 1).
 *
 * Nötig, weil Breitengrade auf der Karte nicht gleich viel Platz einnehmen:
 * Deutschlands 7,8 Breitengrade sind auf dem Schirm deutlich höher als 7,8
 * Längengrade breit. Wer das übersieht, rechnet in Grad und wundert sich.
 */
function mercatorY(latitude: number): number {
  const radians = (latitude * Math.PI) / 180
  return 0.5 - Math.log(Math.tan(Math.PI / 4 + radians / 2)) / (2 * Math.PI)
}

/** Die Umkehrung — vom normierten Y zurück auf die Breite. */
function latitudeAt(y: number): number {
  const latitude =
    (2 * (Math.atan(Math.exp((0.5 - y) * 2 * Math.PI)) - Math.PI / 4) * 180) / Math.PI
  return Math.min(Math.max(latitude, -MERCATOR_LIMIT), MERCATOR_LIMIT)
}

/**
 * Die Zoomstufe, auf der `bounds` gerade eben ins Fenster passt.
 *
 * Als `minZoom` gesetzt ist sie die Antwort auf „voll ausgezoomt sieht man
 * Deutschland": weiter heraus geht nicht, und weiter heraus muss auch nicht,
 * weil dort nichts steht. Beide Achsen werden gerechnet und die kleinere
 * gewinnt — die Achse, die zuerst anstößt, bestimmt den Ausschnitt.
 */
export function minZoomForBounds(
  bounds: Bounds,
  viewport: ViewportSize,
  padding: number = MAP_PADDING,
): number {
  const [[west, south], [east, north]] = bounds
  const spanX = Math.abs(east - west) / 360
  const spanY = Math.abs(mercatorY(south) - mercatorY(north))

  // Mindestens ein Pixel: ein Fenster, das schmaler ist als sein eigenes
  // Padding, gibt es nur beim Aufbau — und log2(0) wäre -Infinity, was MapLibre
  // als Zoomgrenze kommentarlos übernimmt.
  const usableWidth = Math.max(viewport.width - 2 * padding, 1)
  const usableHeight = Math.max(viewport.height - 2 * padding, 1)

  return Math.min(
    Math.log2(usableWidth / (spanX * TILE_SIZE)),
    Math.log2(usableHeight / (spanY * TILE_SIZE)),
  )
}

/**
 * Der Rahmen, aus dem sich die Karte nicht herausschieben lässt.
 *
 * Warum gerechnet und nicht als Konstante hingeschrieben: MapLibre setzt
 * `maxBounds` durch, indem es notfalls *hineinzoomt*. Ein fester Rahmen ist
 * damit nicht bloß eine Scroll-Schranke, sondern heimlich auch eine
 * Zoom-Schranke — und eine, die vom Seitenverhältnis des Fensters abhängt.
 * Genau daran scheiterte der Einpass vorher: der Rahmen war auf einem 16:10-
 * Monitor zu niedrig und auf einem Telefon zu schmal, und `fitBounds` wurde
 * still übergangen.
 *
 * Abgeleitet kann das nicht mehr passieren, denn der Rahmen enthält den
 * Ausschnitt per Konstruktion. Die Regel, die übrig bleibt, ist eine, die man
 * jemandem sagen kann: **höchstens einen halben Bildschirm über das Land
 * hinaus.** Deutschlands Rand bleibt also immer mindestens bis zur Mitte des
 * Fensters sichtbar — weiter weg gibt es nichts zu sehen.
 */
export function panFrameFor(
  bounds: Bounds,
  viewport: ViewportSize,
  padding: number = MAP_PADDING,
): [[number, number], [number, number]] {
  const worldSize = TILE_SIZE * 2 ** minZoomForBounds(bounds, viewport, padding)
  const halfWidth = ((viewport.width / worldSize) * 360) / 2
  const halfHeight = viewport.height / worldSize / 2
  const [[west, south], [east, north]] = bounds

  return [
    [Math.max(west - halfWidth, -180), latitudeAt(mercatorY(south) + halfHeight)],
    [Math.min(east + halfWidth, 180), latitudeAt(mercatorY(north) - halfHeight)],
  ]
}
