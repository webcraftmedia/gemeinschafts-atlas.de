import { vi } from 'vitest'

/**
 * A stand-in for maplibre-gl, for specs that merely *contain* the map.
 *
 * MapLibre needs WebGL, and happy-dom has none: constructing a real map throws
 * a GPUInitializationError from inside a promise nobody awaits, which surfaces
 * as an unhandled rejection attributed to whichever spec happened to be
 * running. Since the map moved onto the landing page, that is three specs whose
 * subject is not the map at all.
 *
 * Deliberately without any assertion surface — a spec that wants to know *how*
 * the map was called builds its own mock and can then see it (CommunityMap.spec).
 * What this one guarantees is only that the component gets through onMounted.
 *
 * Every constructor is a `function` and not an arrow: the component calls them
 * with `new`, and arrow functions are not constructors. Returning an object
 * from a constructor replaces the freshly created `this` — that is how the
 * chained calls below keep working.
 */
export function mapLibreStub(): Partial<typeof import('maplibre-gl')> {
  const marker = {
    setLngLat: () => marker,
    setPopup: () => marker,
    addTo: () => marker,
  }

  return {
    Map: vi.fn(function () {
      return {
        addControl: vi.fn(),
        remove: vi.fn(),
        fitBounds: vi.fn(),
        setMinZoom: vi.fn(),
        setMaxBounds: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
      }
    }),
    Marker: vi.fn(function () {
      return marker
    }),
    Popup: vi.fn(function () {
      return { setDOMContent: () => ({}) }
    }),
    NavigationControl: vi.fn(function () {
      return {}
    }),
    setWorkerUrl: vi.fn(),
  }
}
