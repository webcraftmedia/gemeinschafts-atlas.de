<script setup lang="ts">
  /**
   * Für die Karte: randlos, ohne Spaltenbreite, mit schwebender Leiste.
   *
   * Die Leiste liegt *über* der Karte statt darüber zu stehen, damit die Karte
   * die volle Höhe bekommt. `pointer-events-none` auf dem Container und
   * `pointer-events-auto` auf den Bedienelementen sorgt dafür, dass man durch
   * die leeren Stellen der Leiste hindurch auf die Karte ziehen kann.
   */
  const { t } = useI18n()
</script>

<template>
  <div class="relative h-[100dvh] overflow-hidden">
    <header
      class="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 p-3 sm:p-4"
    >
      <NuxtLink
        to="/"
        class="pointer-events-auto rounded-full bg-paper/90 px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-ink/10 backdrop-blur hover:bg-paper"
      >
        {{ t('app.brand') }}
      </NuxtLink>
      <!--
        Kein Sprungziel mehr, sondern eine Adresse: Die Liste ist seit dem
        Umbau eine eigene Seite. Für alle, die die Karte nicht bedienen können,
        ist dieser Link der Weg zum gleichwertigen Angebot — er steht deshalb
        in der Leiste und nicht irgendwo unten.
      -->
      <nav class="pointer-events-auto" :aria-label="t('app.nav-label')">
        <NuxtLink
          to="/liste"
          class="rounded-full bg-paper/90 px-4 py-2 text-sm shadow-sm ring-1 ring-ink/10 backdrop-blur hover:bg-paper"
        >
          {{ t('app.to-list') }}
        </NuxtLink>
      </nav>
    </header>

    <main id="main" class="h-full overflow-y-auto">
      <slot />
    </main>
  </div>
</template>
