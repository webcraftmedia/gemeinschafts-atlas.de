<script setup lang="ts">
  import { communities } from '~/data/communities'

  /**
   * Die Liste als eigene Seite.
   *
   * Vorher hing sie unter der Karte — auf zwei Seiten, zweimal derselbe Inhalt,
   * und auf der Startseite stand sie hinter zwei Fensterhöhen Bühne. Eine
   * eigene Adresse ist das Ehrlichere: Sie lässt sich verschicken, sie ist der
   * Ort, auf den die Karte für alle verweist, die sie nicht bedienen können,
   * und sie ist das, was eine Suchmaschine von diesen Daten zu sehen bekommt.
   */
  const { t } = useI18n()

  useHead({
    title: t('pages.liste.title'),
    meta: [{ name: 'description', content: t('pages.liste.description') }],
  })
</script>

<template>
  <div>
    <h1 class="font-serif text-3xl leading-tight sm:text-4xl">{{ t('pages.liste.title') }}</h1>
    <p class="mt-3 max-w-prose leading-relaxed text-ink-muted">{{ t('pages.liste.intro') }}</p>

    <p class="mt-6">
      <NuxtLink
        to="/karte"
        class="border-b border-atlas/40 pb-0.5 font-medium text-atlas-dark transition-colors hover:border-atlas-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-atlas-dark"
      >
        {{ t('app.to-map') }}
      </NuxtLink>
    </p>

    <CommunityList :communities="communities" class="mt-12" />
  </div>
</template>
