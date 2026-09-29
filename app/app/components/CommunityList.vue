<script setup lang="ts">
  import type { Community } from '~/data/communities'

  /**
   * Die Karte in Textform — und nicht als Zugeständnis, sondern als Pflicht.
   *
   * Eine WebGL-Karte ist per Tastatur kaum und per Screenreader gar nicht
   * bedienbar: Marker sind Pixel auf einer Canvas. Eine gleichwertige Liste ist
   * deshalb das, was Barrierefreiheit hier konkret bedeutet (BFSG/WCAG 1.1.1
   * und 2.1.1). Nebenbei ist sie das Einzige, was Suchmaschinen von diesen
   * Daten indizieren können.
   *
   * Nur die Liste selbst, ohne Überschrift und ohne Abschnitt: Seit sie unter
   * `/liste` eine eigene Seite hat, ist die Überschrift deren `h1` und gehört
   * dorthin. Eine Komponente, die ihre eigene Überschriftenebene mitbringt,
   * passt immer nur an eine Stelle.
   */
  defineProps<{ communities: Community[] }>()

  const { t } = useI18n()

  /** Link auf die Stelle bei OpenStreetMap — dort gibt es die Details, die unsere Karte bewusst weglässt. */
  function osmUrl(community: Community): string {
    const [lon, lat] = community.coordinates
    return `https://www.openstreetmap.org/?mlat=${String(lat)}&mlon=${String(lon)}#map=14/${String(lat)}/${String(lon)}`
  }
</script>

<template>
  <ul class="space-y-8">
    <li v-for="community in communities" :key="community.id" class="border-t border-ink/10 pt-6">
      <h2 class="font-serif text-xl">{{ community.name }}</h2>
      <p class="text-sm text-ink-muted">{{ community.place }}</p>
      <p class="mt-2">{{ community.purpose }}</p>
      <p v-if="community.guests" class="mt-2 text-sm font-medium text-atlas-dark">
        {{ t('components.CommunityList.guests') }}
      </p>
      <p class="mt-3 text-sm">
        <AppLink :to="osmUrl(community)">
          {{ t('components.CommunityList.osm') }}
        </AppLink>
      </p>
    </li>
  </ul>
</template>
