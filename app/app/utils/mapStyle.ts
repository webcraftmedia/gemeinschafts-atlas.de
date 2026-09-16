import type { StyleSpecification } from 'maplibre-gl'

/**
 * „Papier und Tusche" als MapLibre-Style.
 *
 * Bei Vector Tiles kommt der Stil nicht vom Kachelanbieter, sondern von hier:
 * die Kachel liefert nur Geometrie und Attribute, jede Farbe und Strichstärke
 * steht in dieser Datei. Ein Anbieterwechsel ändert deshalb nichts am Aussehen,
 * solange das Schema dasselbe bleibt (hier: OpenMapTiles).
 *
 * Die Gestaltung ist bewusst zurückhaltend: Der Atlas soll zeigen, *wo* die
 * Gemeinschaften sind. Alles, was mit den Markern um Aufmerksamkeit
 * konkurriert — Gebäude, Straßenklassen, POIs — ist gar nicht erst enthalten.
 * Das hält nebenbei die Renderlast niedrig.
 */

/** Cremeweißes Papier. */
const PAPER = '#f4ece0'
/** Tusche, für Grenzen und Schrift. */
const INK = '#2f2a24'
/** Verdünnte Tusche für das, was nur Kontext ist. */
const INK_LIGHT = '#8a8175'
/** Wasser als blassgrauer Aquarellton, nicht als Blau. */
const WATER = '#cdd6d5'
/** Wald und Wiese als kaum sichtbarer Grünstich. */
const GREEN = '#e6e6d2'

export interface MapStyleOptions {
  /** TileJSON-URL der Vector Tiles (OpenMapTiles-Schema). */
  tilesUrl: string
  /** Glyph-Endpunkt für die Beschriftung, mit {fontstack}/{range}. */
  glyphsUrl: string
}

export function paperAndInkStyle({ tilesUrl, glyphsUrl }: MapStyleOptions): StyleSpecification {
  return {
    version: 8,
    name: 'Papier und Tusche',
    glyphs: glyphsUrl,
    sources: {
      openmaptiles: {
        type: 'vector',
        url: tilesUrl,
        // Pflicht, nicht Höflichkeit: die Daten stehen unter ODbL. MapLibres
        // AttributionControl liest das hier aus, deshalb steht es an der Quelle
        // und nicht irgendwo im Template, wo es beim nächsten Umbau verschwindet.
        attribution:
          '<a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> © ' +
          '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a>, ' +
          'Daten © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>-Mitwirkende',
      },
    },
    layers: [
      {
        id: 'paper',
        type: 'background',
        paint: { 'background-color': PAPER },
      },
      {
        id: 'greens',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        filter: ['in', 'class', 'wood', 'grass', 'farmland'],
        paint: { 'fill-color': GREEN, 'fill-opacity': 0.6 },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: { 'fill-color': WATER },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        minzoom: 6,
        paint: {
          'line-color': WATER,
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.4, 12, 1.6],
        },
      },
      {
        // Bundesländer: gestrichelt und dünn, damit sie gliedern ohne zu trennen.
        id: 'boundary-state',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['all', ['==', 'admin_level', 4], ['!=', 'maritime', 1]],
        paint: {
          'line-color': INK_LIGHT,
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.4, 10, 1],
          'line-dasharray': [3, 2],
          'line-opacity': 0.8,
        },
      },
      {
        // Die Landesgrenze trägt die Zeichnung — kräftiger als alles andere.
        id: 'boundary-country',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['all', ['==', 'admin_level', 2], ['!=', 'maritime', 1]],
        // line-join ist layout, nicht paint — der Style-Spec-Test unten hält das fest.
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': INK,
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 8, 2.2],
        },
      },
      {
        // Nur größere Orte, und erst ab einem Zoom, auf dem sie nicht mit den
        // Markern kollidieren.
        id: 'place-labels',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        filter: ['in', 'class', 'city', 'town'],
        minzoom: 5,
        layout: {
          'text-field': ['coalesce', ['get', 'name:de'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 10, 14],
          'text-transform': 'none',
          'text-letter-spacing': 0.08,
          'text-max-width': 8,
        },
        paint: {
          'text-color': INK,
          'text-halo-color': PAPER,
          'text-halo-width': 1.4,
          'text-opacity': 0.85,
        },
      },
    ],
  }
}
