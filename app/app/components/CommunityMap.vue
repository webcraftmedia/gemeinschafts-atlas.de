<script setup lang="ts">
  import type { Map as MapLibreMap } from 'maplibre-gl'
  import type { Community } from '~/data/communities'

  import { GERMANY_BOUNDS } from '~/data/communities'
  import { paperAndInkStyle } from '~/utils/mapStyle'
  import { minZoomForBounds, panFrameFor, MAP_PADDING } from '~/utils/mapView'

  /**
   * Die Vektorkarte.
   *
   * maplibre-gl wird erst in onMounted geladen, aus zwei Gründen: Die Bibliothek
   * braucht DOM und WebGL, existiert beim Server-Rendering also nicht sinnvoll —
   * und sie ist die mit Abstand größte Abhängigkeit des Projekts. Als
   * dynamischer Import landet sie in einem eigenen Chunk — nachgemessen am
   * 29.09.2026: 103 kB brotli für die Seite, 349 kB für die Karte.
   * `.size-limit.json` misst beide Hälften getrennt und hält damit fest, dass
   * diese Trennung bestehen bleibt.
   *
   * Barrierefreiheit: Die Marker sind bewusst *nicht* fokussierbar. Ein
   * Tastaturnutzer soll nicht durch Dutzende Punkte auf einer Canvas tabben,
   * deren Position er nicht sieht — für ihn ist CommunityList das gleichwertige
   * Angebot. Die Zoom-Bedienelemente bleiben erreichbar.
   */
  const props = withDefaults(
    defineProps<{
      communities: Community[]
      /**
       * Für die Karte *in* einer scrollenden Seite: Das Rad scrollt dann die
       * Seite und zoomt erst mit Strg, ein Finger schiebt die Seite und erst
       * zwei die Karte. Ohne das fängt eine bildschirmfüllende Karte den
       * Scroll ein, und die Seite endet für den Besucher an ihrem oberen Rand.
       */
      cooperativeGestures?: boolean
    }>(),
    { cooperativeGestures: false },
  )

  const { t } = useI18n()
  const { tilesUrl, glyphsUrl } = useRuntimeConfig().public

  const container = useTemplateRef<HTMLDivElement>('container')
  let map: MapLibreMap | null = null

  /**
   * Zoom-Untergrenze und Schiebe-Rahmen an die Fenstergröße anpassen.
   *
   * Beides hängt am Seitenverhältnis des Containers, und das ändert sich: beim
   * Aufbau, beim Drehen des Telefons, beim Ein- und Ausblenden der Adressleiste
   * mobiler Browser. Eine feste Zahl stimmt deshalb immer nur für ein Fenster —
   * genau daran scheiterte der volle Deutschland-Blick vorher.
   */
  function fitToContainer(instance: MapLibreMap, element: HTMLElement): void {
    const viewport = { width: element.clientWidth, height: element.clientHeight }
    // Ein Container ohne Maße kommt vor — noch nicht im Layout, oder in einem
    // eingeklappten Bereich. Dann ist jede Grenze geraten; lieber die alte
    // behalten, bis wirklich gemessen werden kann.
    if (viewport.width <= 0 || viewport.height <= 0) return

    instance.setMaxBounds(panFrameFor(GERMANY_BOUNDS, viewport))
    instance.setMinZoom(minZoomForBounds(GERMANY_BOUNDS, viewport))
  }

  onMounted(async () => {
    const [maplibre, workerUrl] = await Promise.all([
      import('maplibre-gl'),
      // MapLibre baut die Worker-URL zur Laufzeit zusammen
      // (`new URL('./' + name, base)`). Was ein Bundler nicht als Literal
      // sieht, gibt er auch nicht aus — die Folge ist ein 404 auf
      // maplibre-gl-worker.mjs und eine Karte, die aussieht, als
      // funktioniere sie: Canvas und Marker sind da, nur dekodiert niemand
      // die Vector Tiles. Genau deshalb prüft der E2E-Test fehlgeschlagene
      // Requests und nicht bloß, ob ein Canvas existiert.
      //
      // ?worker&url statt ?url: Der Worker importiert seinerseits
      // maplibre-gl-shared.mjs. ?url kopiert nur die eine Datei und der
      // Fehler wandert eine Ebene tiefer; Vites Worker-Plugin bündelt den
      // Abhängigkeitsbaum mit ein.
      import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ])
    if (!container.value) return
    // Einmal festhalten: die beiden Handler unten laufen später und sollen
    // nicht jedes Mal aufs Neue fragen müssen, ob es das Element noch gibt.
    const frame = container.value

    maplibre.setWorkerUrl(workerUrl.default)

    const instance = new maplibre.Map({
      container: frame,
      style: paperAndInkStyle({ tilesUrl, glyphsUrl }),
      bounds: GERMANY_BOUNDS,
      fitBoundsOptions: { padding: MAP_PADDING },
      maxZoom: 14,
      // Die Karte ist eine Übersicht, keine Navigation — Drehen und Kippen
      // bringen nichts und verlieren nur die Orientierung.
      pitchWithRotate: false,
      dragRotate: false,
      cooperativeGestures: props.cooperativeGestures,
      // MapLibres eigene Hinweistexte sind englisch und lassen sich nur hier
      // ersetzen — ein deutscher Hinweis, der nur auf Englisch erscheint, ist
      // kein Hinweis.
      locale: {
        'CooperativeGesturesHandler.WindowsHelpText': t('components.CommunityMap.gesture-windows'),
        'CooperativeGesturesHandler.MacHelpText': t('components.CommunityMap.gesture-mac'),
        'CooperativeGesturesHandler.MobileHelpText': t('components.CommunityMap.gesture-mobile'),
      },
      attributionControl: { compact: true },
    })
    map = instance

    instance.addControl(new maplibre.NavigationControl({ showCompass: false }), 'bottom-right')

    // Grenzen nachziehen, sooft sich die Containergröße ändert. MapLibre meldet
    // das von sich aus (trackResize), und es ist nicht bloß der Wechsel zwischen
    // Hoch- und Querformat: mobile Browser blenden ihre Adressleiste beim
    // Scrollen ein und aus, und die Karte ist 100 dvh hoch.
    instance.on('resize', () => {
      fitToContainer(instance, frame)
    })

    // Noch einmal einpassen, sobald die Karte steht. Beim Konstruieren hat der
    // Container seine endgültige Größe oft noch nicht, und MapLibre passt zwar
    // die Leinwand an, wiederholt den Fit aber nicht — sichtbar daran, dass der
    // Süden Deutschlands unten abgeschnitten war. Ohne Animation, damit die
    // Seite nicht beim Öffnen zu wackeln anfängt.
    instance.once('load', () => {
      fitToContainer(instance, frame)
      instance.fitBounds(GERMANY_BOUNDS, { padding: MAP_PADDING, animate: false })
    })

    for (const community of props.communities) {
      const element = document.createElement('div')
      element.className = 'atlas-marker'
      // Rein dekorativ: die Information steht in der Liste.
      element.setAttribute('aria-hidden', 'true')

      // Popup-Inhalt als DOM statt als HTML-String — damit ein Name mit spitzen
      // Klammern Text bleibt und kein Markup wird, auch wenn die Daten später
      // aus der Datenbank kommen.
      const popupContent = document.createElement('div')
      const name = document.createElement('strong')
      name.textContent = community.name
      const place = document.createElement('div')
      place.textContent = community.place
      const purpose = document.createElement('p')
      purpose.textContent = community.purpose
      popupContent.append(name, place, purpose)

      new maplibre.Marker({ element })
        .setLngLat(community.coordinates)
        .setPopup(new maplibre.Popup({ offset: 14 }).setDOMContent(popupContent))
        .addTo(instance)
    }
  })

  onBeforeUnmount(() => {
    map?.remove()
    map = null
  })
</script>

<template>
  <div
    ref="container"
    role="region"
    :aria-label="t('components.CommunityMap.label')"
    class="h-full w-full"
  >
    <p class="sr-only">{{ t('components.CommunityMap.alternative') }}</p>
  </div>
</template>

<style>
  /* Kein scoped: Die Marker-Elemente werden von MapLibre erzeugt und liegen
     außerhalb des Scopes dieser Komponente. */
  .atlas-marker {
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 9999px;
    background: var(--color-atlas);
    border: 2px solid var(--color-paper);
    box-shadow: 0 1px 3px rgb(47 42 36 / 35%);
    cursor: pointer;
  }

  /* MapLibres Bedienelemente an das Papier angleichen. */
  .maplibregl-ctrl-group {
    background: var(--color-paper);
  }
</style>
