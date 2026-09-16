<script setup lang="ts">
  import type { Map as MapLibreMap } from 'maplibre-gl'
  import type { Community } from '~/data/communities'

  import { GERMANY_BOUNDS, MAP_MAX_BOUNDS } from '~/data/communities'
  import { paperAndInkStyle } from '~/utils/mapStyle'

  /**
   * Die Vektorkarte.
   *
   * maplibre-gl wird erst in onMounted geladen, aus zwei Gründen: Die Bibliothek
   * braucht DOM und WebGL, existiert beim Server-Rendering also nicht sinnvoll —
   * und sie ist ~250 kB. Als dynamischer Import landet sie in einem eigenen
   * Chunk, den nur bezahlt, wer die Karte auch öffnet. Die Startseite bleibt
   * davon unberührt (siehe .size-limit.json, das beide getrennt misst).
   *
   * Barrierefreiheit: Die Marker sind bewusst *nicht* fokussierbar. Ein
   * Tastaturnutzer soll nicht durch Dutzende Punkte auf einer Canvas tabben,
   * deren Position er nicht sieht — für ihn ist CommunityList das gleichwertige
   * Angebot. Die Zoom-Bedienelemente bleiben erreichbar.
   */
  const props = defineProps<{ communities: Community[] }>()

  const { t } = useI18n()
  const { tilesUrl, glyphsUrl } = useRuntimeConfig().public

  const container = useTemplateRef<HTMLDivElement>('container')
  let map: MapLibreMap | null = null

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

    maplibre.setWorkerUrl(workerUrl.default)

    map = new maplibre.Map({
      container: container.value,
      style: paperAndInkStyle({ tilesUrl, glyphsUrl }),
      bounds: GERMANY_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      // Hält die Karte in der Gegend: außerhalb gibt es keine Einträge, und wer
      // versehentlich über den Atlantik scrollt, findet selten zurück. Bewusst
      // der weitere Rahmen — siehe MAP_MAX_BOUNDS.
      maxBounds: MAP_MAX_BOUNDS,
      minZoom: 4,
      maxZoom: 14,
      // Die Karte ist eine Übersicht, keine Navigation — Drehen und Kippen
      // bringen nichts und verlieren nur die Orientierung.
      pitchWithRotate: false,
      dragRotate: false,
      attributionControl: { compact: true },
    })

    map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'bottom-right')

    // Noch einmal einpassen, sobald die Karte steht. Beim Konstruieren hat der
    // Container seine endgültige Größe oft noch nicht, und MapLibre passt zwar
    // die Leinwand an, wiederholt den Fit aber nicht — sichtbar daran, dass der
    // Süden Deutschlands unten abgeschnitten war. Ohne Animation, damit die
    // Seite nicht beim Öffnen zu wackeln anfängt.
    map.once('load', () => {
      map?.fitBounds(GERMANY_BOUNDS, { padding: 24, animate: false })
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
        .addTo(map)
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
