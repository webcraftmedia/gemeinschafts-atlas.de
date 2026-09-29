import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import CommunityMap from './CommunityMap.vue'

import { communities, GERMANY_BOUNDS } from '~/data/communities'
import { minZoomForBounds, panFrameFor, MAP_PADDING } from '~/utils/mapView'

/**
 * MapLibre braucht WebGL, das happy-dom nicht hat — die Bibliothek wird deshalb
 * ersetzt. Getestet wird damit nicht, ob MapLibre funktioniert (das ist deren
 * Aufgabe), sondern *womit wir es aufrufen*: die Grenzen, der Style, ein Marker
 * je Gemeinschaft, und ob die Karte beim Verlassen der Seite wieder abgeräumt
 * wird. Genau das sind die Stellen, an denen wir Fehler machen können.
 */
const mapInstance = vi.hoisted(() => ({
  addControl: vi.fn(),
  remove: vi.fn(),
  fitBounds: vi.fn(),
  setMinZoom: vi.fn(),
  setMaxBounds: vi.fn(),
  // `once` ruft den Handler sofort auf — im Test ist "die Karte ist geladen"
  // kein Warten wert, und so lässt sich prüfen, was danach passiert.
  once: vi.fn((_event: string, handler: () => void) => {
    handler()
  }),
  // `on` merkt sich den Handler, statt ihn zu rufen: ein resize passiert später
  // und wird im Test ausgelöst, wo er hingehört.
  on: vi.fn(),
}))
const markerInstance = vi.hoisted(() => {
  const marker = {
    setLngLat: vi.fn(() => marker),
    setPopup: vi.fn(() => marker),
    addTo: vi.fn(() => marker),
  }
  return marker
})
const popupInstance = vi.hoisted(() => {
  const popup = { setDOMContent: vi.fn(() => popup) }
  return popup
})

// Bewusst `function` und keine Pfeilfunktion: die Komponente ruft diese Mocks
// mit `new` auf, und Pfeilfunktionen sind keine Konstruktoren. Eine Funktion,
// die ein Objekt zurückgibt, ersetzt beim `new` das erzeugte `this` — damit
// liefert jeder Aufruf dieselbe beobachtbare Instanz.
const MapMock = vi.hoisted(() =>
  vi.fn(function () {
    return mapInstance
  }),
)
const MarkerMock = vi.hoisted(() =>
  vi.fn(function () {
    return markerInstance
  }),
)
const PopupMock = vi.hoisted(() =>
  vi.fn(function () {
    return popupInstance
  }),
)
const NavigationControlMock = vi.hoisted(() =>
  vi.fn(function () {
    return { name: 'nav' }
  }),
)

vi.mock(import('maplibre-gl'), () => ({
  Map: MapMock,
  Marker: MarkerMock,
  Popup: PopupMock,
  NavigationControl: NavigationControlMock,
  setWorkerUrl: vi.fn(),
}))
// Das Worker-Asset ist ein Vite-Konstrukt (?worker&url) und existiert unter
// vitest nicht — die URL wird gebraucht, aber nie aufgerufen.
vi.mock(import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'), () => ({
  default: '/maplibre-gl-worker.js',
}))
vi.mock(import('maplibre-gl/dist/maplibre-gl.css'), () => ({}))

/**
 * happy-dom rechnet kein Layout — jedes Element misst 0 × 0. Genau diese Zahl
 * ist für die Karte aber die interessante: aus ihr werden Zoomgrenze und
 * Schiebe-Rahmen abgeleitet. Sie wird deshalb gesetzt, und ein Test setzt sie
 * bewusst zurück auf nichts.
 */
const VIEWPORT = { width: 1440, height: 900 }

function measureContainerAs({ width, height }: { width: number; height: number }) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    value: width,
    configurable: true,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    value: height,
    configurable: true,
  })
}

async function mountMap(props: { cooperativeGestures?: boolean } = {}) {
  const wrapper = await mountSuspended(CommunityMap, { props: { communities, ...props } })
  // onMounted lädt maplibre dynamisch nach; ein Tick reicht dafür nicht.
  await flushPromises()
  await flushPromises()
  return wrapper
}

describe('CommunityMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    measureContainerAs(VIEWPORT)
  })

  it('starts on Germany', async () => {
    await mountMap()

    const options = MapMock.mock.calls[0]?.[0] as Record<string, unknown>
    expect(options.bounds).toStrictEqual(GERMANY_BOUNDS)
    expect(options.fitBoundsOptions).toStrictEqual({ padding: MAP_PADDING })
  })

  it('fits Germany again once the map has loaded', async () => {
    await mountMap()

    // Der Container hat beim Konstruieren oft noch nicht seine endgültige Größe;
    // ohne diesen zweiten Fit war der Süden Deutschlands abgeschnitten.
    expect(mapInstance.fitBounds).toHaveBeenCalledWith(GERMANY_BOUNDS, {
      padding: MAP_PADDING,
      animate: false,
    })
  })

  it('makes the Germany fit the point you cannot zoom out past', async () => {
    await mountMap()

    // Der Kern des Umbaus: „ganz herausgezoomt" heißt „Deutschland ist im
    // Bild". Die Zahl kommt aus der Fenstergröße, weil sie nur so auf jedem
    // Seitenverhältnis stimmt — vorher stand hier eine feste 4.
    expect(mapInstance.setMinZoom).toHaveBeenCalledWith(minZoomForBounds(GERMANY_BOUNDS, VIEWPORT))
  })

  it('derives the frame it cannot be dragged out of', async () => {
    await mountMap()

    // Der Rahmen hält die Karte in der Gegend — aber abgeleitet, nicht fest:
    // MapLibre setzt maxBounds notfalls durch Hineinzoomen durch, ein zu enger
    // Rahmen wäre also heimlich die Zoomgrenze und würde den Fit oben
    // aushebeln.
    expect(mapInstance.setMaxBounds).toHaveBeenCalledWith(panFrameFor(GERMANY_BOUNDS, VIEWPORT))
  })

  it('recomputes both limits when the container changes size', async () => {
    await mountMap()
    const resize = mapInstance.on.mock.calls.find(
      ([event]) => event === 'resize',
    )?.[1] as () => void

    // Ein Telefon im Querformat, und beim Scrollen zieht sich die Adressleiste
    // zusammen: dieselbe Karte, ein anderes Seitenverhältnis, andere Grenzen.
    const turned = { width: 844, height: 390 }
    measureContainerAs(turned)
    resize()

    expect(mapInstance.setMinZoom).toHaveBeenLastCalledWith(
      minZoomForBounds(GERMANY_BOUNDS, turned),
    )
    expect(mapInstance.setMaxBounds).toHaveBeenLastCalledWith(panFrameFor(GERMANY_BOUNDS, turned))
  })

  it('sets no limits it would have to guess', async () => {
    // Ein Container ohne Maße — noch nicht im Layout oder eingeklappt. Eine aus
    // 0 × 0 gerechnete Grenze wäre nicht bloß falsch, sie würde die Karte auf
    // eine unbrauchbare Stufe zwingen.
    measureContainerAs({ width: 0, height: 0 })
    await mountMap()

    expect(mapInstance.setMinZoom).not.toHaveBeenCalled()
    expect(mapInstance.setMaxBounds).not.toHaveBeenCalled()
  })

  it('leaves the page scrolling when it is embedded in one', async () => {
    await mountMap({ cooperativeGestures: true })

    // Auf der Startseite füllt die Karte den Bildschirm mitten in einer
    // scrollenden Seite. Ohne das fängt sie das Mausrad ab, und die Seite hört
    // für den Besucher an ihrem oberen Rand auf.
    const options = MapMock.mock.calls[0]?.[0] as Record<string, unknown>
    expect(options.cooperativeGestures).toBe(true)
    // Und der Hinweis dazu auf Deutsch — MapLibres eigener ist englisch und
    // nur über `locale` zu ersetzen.
    expect(options.locale).toMatchObject({
      'CooperativeGesturesHandler.WindowsHelpText': 'Zum Zoomen Strg + Scrollen benutzen',
    })
  })

  it('takes the whole page when nobody says otherwise', async () => {
    await mountMap()

    // Auf /karte ist die Karte die Seite; dort wäre die Rückfrage beim Zoomen
    // eine Schikane.
    const options = MapMock.mock.calls[0]?.[0] as Record<string, unknown>
    expect(options.cooperativeGestures).toBe(false)
  })

  it('disables rotating and tilting', async () => {
    await mountMap()

    const options = MapMock.mock.calls[0]?.[0] as Record<string, unknown>
    expect(options.dragRotate).toBe(false)
    expect(options.pitchWithRotate).toBe(false)
  })

  it('places one marker per community, at its coordinates', async () => {
    await mountMap()

    expect(MarkerMock).toHaveBeenCalledTimes(communities.length)
    const passed = markerInstance.setLngLat.mock.calls.map(([coordinates]) => coordinates)
    expect(passed).toStrictEqual(communities.map((community) => community.coordinates))
  })

  it('hides the markers from assistive technology', async () => {
    await mountMap()

    // Die Punkte sind Dekoration auf einer Canvas; die Information steht in
    // CommunityList. Ein Screenreader, der sie vorliest, liest Rauschen.
    const element = MarkerMock.mock.calls[0]?.[0]?.element as HTMLElement
    expect(element.getAttribute('aria-hidden')).toBe('true')
  })

  it('builds the popup as DOM, not as an HTML string', async () => {
    await mountMap()

    // setDOMContent statt setHTML: damit ein Name mit spitzen Klammern Text
    // bleibt, auch wenn die Daten später aus der Datenbank kommen.
    const content = popupInstance.setDOMContent.mock.calls[0]?.[0] as HTMLElement
    expect(content.textContent).toContain(communities[0]!.name)
    expect(content.textContent).toContain(communities[0]!.purpose)
  })

  it('offers zoom controls without a compass', async () => {
    await mountMap()

    expect(NavigationControlMock).toHaveBeenCalledWith({ showCompass: false })
    // Unten rechts, damit die Bedienelemente nicht unter der schwebenden Leiste
    // des Layouts liegen.
    expect(mapInstance.addControl).toHaveBeenCalledWith(expect.anything(), 'bottom-right')
  })

  it('names the map region and points at the list', async () => {
    const wrapper = await mountMap()

    const region = wrapper.get('[role="region"]')
    expect(region.attributes('aria-label')).toBe('Karte der Gemeinschaften in Deutschland')
    expect(wrapper.get('.sr-only').text()).toContain('Liste')
  })

  it('builds no map when the page is left while maplibre is still loading', async () => {
    // Ein echtes Rennen: maplibre-gl kommt als eigener Chunk über das Netz, und
    // wer in der Zeit zurücknavigiert, hinterlässt eine Komponente ohne
    // Container. Ohne die Prüfung würde MapLibre auf null konstruiert werden.
    const wrapper = await mountSuspended(CommunityMap, { props: { communities } })
    wrapper.unmount()
    await flushPromises()
    await flushPromises()

    expect(MapMock).not.toHaveBeenCalled()
  })

  it('tears the map down when it goes away', async () => {
    const wrapper = await mountMap()
    wrapper.unmount()

    // Ohne remove() bleiben WebGL-Kontext und Event-Listener am Leben; nach ein
    // paar Navigationen weigert sich der Browser, weitere Kontexte zu geben.
    expect(mapInstance.remove).toHaveBeenCalledTimes(1)
  })
})
