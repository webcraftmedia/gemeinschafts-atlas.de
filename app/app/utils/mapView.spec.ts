import { describe, it, expect } from 'vitest'

import { minZoomForBounds, panFrameFor, MAP_PADDING } from './mapView'

import { GERMANY_BOUNDS } from '~/data/communities'

/**
 * Fenster, an denen die Rechnung hängt. Nicht erfunden, sondern die Enden des
 * Spektrums: das schmalste Hochformat, das noch vorkommt, ein gewöhnliches
 * Notebook, ein breiter Monitor. Dazwischen liegt alles andere.
 */
const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  laptop: { width: 1440, height: 900 },
  wide: { width: 2560, height: 1080 },
}

/** Weltbreite in Pixeln bei dieser Zoomstufe — MapLibres Maßstab. */
function worldSize(zoom: number): number {
  return 512 * 2 ** zoom
}

/** Was bei diesem Zoom ins Fenster passt, in Anteilen der Weltkarte. */
function visibleSpan(zoom: number, viewport: { width: number; height: number }) {
  return { x: viewport.width / worldSize(zoom), y: viewport.height / worldSize(zoom) }
}

/** Dasselbe Maß für ein Rechteck aus Koordinaten. */
function boundsSpan(bounds: readonly [readonly [number, number], readonly [number, number]]) {
  const [[west, south], [east, north]] = bounds
  const mercatorY = (latitude: number) =>
    0.5 - Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360)) / (2 * Math.PI)
  return { x: (east - west) / 360, y: Math.abs(mercatorY(south) - mercatorY(north)) }
}

/** Deutschland in demselben Maß — der Sollwert für alles Folgende. */
const germanySpan = boundsSpan(GERMANY_BOUNDS)

describe('minZoomForBounds', () => {
  it.each(Object.entries(VIEWPORTS))('shows all of Germany on %s', (_name, viewport) => {
    // Der Auftrag in einer Zeile: ganz herausgezoomt ist Deutschland im Bild.
    // Vorher war das an eine feste minZoom gebunden und stimmte auf genau
    // einem Seitenverhältnis.
    const span = visibleSpan(minZoomForBounds(GERMANY_BOUNDS, viewport), viewport)

    expect(span.x).toBeGreaterThanOrEqual(germanySpan.x)
    expect(span.y).toBeGreaterThanOrEqual(germanySpan.y)
  })

  it.each(Object.entries(VIEWPORTS))('wastes no room on %s', (_name, viewport) => {
    // Die Gegenprobe zum Test darüber: passen *würde* auch eine Weltkarte. Eine
    // Achse muss genau anstoßen, sonst ist die Untergrenze bloß irgendeine Zahl,
    // die zufällig groß genug war.
    const span = visibleSpan(minZoomForBounds(GERMANY_BOUNDS, viewport, 0), viewport)

    expect(Math.min(span.x / germanySpan.x, span.y / germanySpan.y)).toBeCloseTo(1, 6)
  })

  it('lets the short side of the window decide', () => {
    // Hochformat: die Höhe hat Platz im Überfluss, die Breite entscheidet.
    // Querformat andersherum. Ein Fehler hier zeigt sich als abgeschnittener
    // Süden — genau der Befund, der diesen Auftrag ausgelöst hat.
    const portrait = visibleSpan(
      minZoomForBounds(GERMANY_BOUNDS, VIEWPORTS.phone, 0),
      VIEWPORTS.phone,
    )
    const landscape = visibleSpan(
      minZoomForBounds(GERMANY_BOUNDS, VIEWPORTS.laptop, 0),
      VIEWPORTS.laptop,
    )

    expect(portrait.x).toBeCloseTo(germanySpan.x, 6)
    expect(landscape.y).toBeCloseTo(germanySpan.y, 6)
  })

  it('zooms out further to make room for the padding', () => {
    const withPadding = minZoomForBounds(GERMANY_BOUNDS, VIEWPORTS.laptop, MAP_PADDING)
    const without = minZoomForBounds(GERMANY_BOUNDS, VIEWPORTS.laptop, 0)

    expect(withPadding).toBeLessThan(without)
  })

  it('stays a number when the container has no size yet', () => {
    // Beim Aufbau und in einem eingeklappten Bereich misst der Container 0×0.
    // Ohne die Untergrenze käme -Infinity heraus, und MapLibre übernähme das
    // als Zoomgrenze, ohne sich zu beschweren.
    const zoom = minZoomForBounds(GERMANY_BOUNDS, { width: 0, height: 0 })

    expect(Number.isFinite(zoom)).toBe(true)
  })
})

/**
 * Der eigentliche Fehler lag nicht in einer Zahl, sondern zwischen zweien: der
 * Scroll-Rahmen war heimlich auch die Zoomgrenze, weil MapLibre `maxBounds`
 * durch Hineinzoomen durchsetzt. Ein zu enger Rahmen macht den Einpass damit
 * unmöglich, ohne dass irgendetwas davon berichtet — `fitBounds` wird still
 * übergangen. Der Rahmen wird deshalb aus dem Fenster abgeleitet, und was hier
 * geprüft wird, ist genau diese Eigenschaft.
 */
describe('panFrameFor', () => {
  // Von hochkant (1:3,5) bis ultrabreit (4:1) — von einem schmalen Telefon bis
  // zu einem maximierten Fenster auf einem 32:9-Monitor.
  const RATIOS = [1 / 3.5, 0.46, 0.7, 1, 1.6, 2.37, 4]

  it.each(RATIOS)('never clamps the Germany fit of a %s:1 window', (ratio) => {
    const viewport = { width: 1000 * ratio, height: 1000 }
    const frame = boundsSpan(panFrameFor(GERMANY_BOUNDS, viewport))
    const span = visibleSpan(minZoomForBounds(GERMANY_BOUNDS, viewport), viewport)

    // Passt der Ausschnitt in den Rahmen, hat MapLibre keinen Anlass
    // hineinzuzoomen — und nur dann heißt „ganz herausgezoomt" wirklich
    // „Deutschland".
    expect(span.x).toBeLessThanOrEqual(frame.x)
    expect(span.y).toBeLessThanOrEqual(frame.y)
  })

  it('lets the map move by half a screen beyond Germany, no further', () => {
    const viewport = VIEWPORTS.laptop
    const [[west, south], [east, north]] = panFrameFor(GERMANY_BOUNDS, viewport)
    const frame = boundsSpan([
      [west, south],
      [east, north],
    ])
    const span = visibleSpan(minZoomForBounds(GERMANY_BOUNDS, viewport), viewport)

    // Der Rahmen ist das Land plus genau eine Fensterbreite — je eine halbe
    // links und rechts. Dieselbe Rechnung für die Höhe.
    expect(frame.x).toBeCloseTo(germanySpan.x + span.x, 6)
    expect(frame.y).toBeCloseTo(germanySpan.y + span.y, 6)
    expect(west).toBeLessThan(GERMANY_BOUNDS[0][0])
    expect(east).toBeGreaterThan(GERMANY_BOUNDS[1][0])
  })

  it('stops at the poles instead of running off the projection', () => {
    // Ein sehr hohes Fenster schiebt den halben Bildschirm über den Rand
    // dessen, was Mercator noch abbildet. Ohne Deckel käme eine Breite
    // jenseits von 90° heraus, und MapLibre rechnet damit weiter, als wäre
    // nichts.
    const [[, south], [, north]] = panFrameFor(GERMANY_BOUNDS, { width: 300, height: 20_000 })

    expect(north).toBeLessThanOrEqual(85.1)
    expect(south).toBeGreaterThanOrEqual(-85.1)
  })
})
