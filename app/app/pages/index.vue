<script setup lang="ts">
  const { t } = useI18n()

  useHead({
    title: t('pages.index.title'),
    meta: [{ name: 'description', content: t('pages.index.description') }],
  })
</script>

<template>
  <div>
    <section class="text-center">
      <h1 class="font-serif text-4xl leading-tight sm:text-5xl">{{ t('pages.index.title') }}</h1>
      <p class="mx-auto mt-6 max-w-prose text-lg text-ink/80">{{ t('pages.index.lead') }}</p>
      <p class="mt-10">
        <NuxtLink
          to="/karte"
          class="inline-block rounded-full bg-atlas px-8 py-3 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-atlas-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-dark"
        >
          {{ t('app.to-map') }}
        </NuxtLink>
      </p>
    </section>

    <!--
      Ausgeschrieben statt über eine Liste iteriert: t() mit zusammengebautem
      Key wäre kürzer, aber @intlify/vue-i18n/no-dynamic-keys verbietet es, weil
      dann weder der Linter noch ein Mensch sieht, welche Keys wirklich benutzt
      werden. Bei drei Absätzen ist die Wiederholung der billigere Preis.
    -->
    <section class="mt-20 space-y-12">
      <article>
        <h2 class="font-serif text-2xl">{{ t('pages.index.roof-title') }}</h2>
        <p class="mt-3 max-w-prose text-ink/80">{{ t('pages.index.roof-text') }}</p>
      </article>
      <article>
        <h2 class="font-serif text-2xl">{{ t('pages.index.guests-title') }}</h2>
        <p class="mt-3 max-w-prose text-ink/80">{{ t('pages.index.guests-text') }}</p>
      </article>
      <article>
        <h2 class="font-serif text-2xl">{{ t('pages.index.era-title') }}</h2>
        <p class="mt-3 max-w-prose text-ink/80">{{ t('pages.index.era-text') }}</p>
      </article>
    </section>
  </div>
</template>
