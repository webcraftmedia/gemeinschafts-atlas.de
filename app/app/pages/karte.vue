<script setup lang="ts">
  import { communities } from '~/data/communities'

  definePageMeta({ layout: 'map' })

  const { t } = useI18n()

  useHead({
    title: t('pages.karte.title'),
    meta: [{ name: 'description', content: t('pages.karte.description') }],
  })
</script>

<template>
  <div>
    <!--
      Die Karte braucht das DOM und WebGL, läuft also nur im Browser. ClientOnly
      liefert serverseitig den Fallback aus, und der ist kein Spinner: Er nennt
      den Weg zum vollständigen Inhalt. Seit die Liste unter `/liste` eine
      eigene Seite hat, ist das ein Link und keine zweite Kopie derselben Daten
      — wer ohne JavaScript kommt, landet mit einem Klick auf einer Seite, die
      vollständig server-gerendert ist.
    -->
    <div class="h-[100dvh] w-full">
      <ClientOnly>
        <CommunityMap :communities="communities" />
        <template #fallback>
          <div
            class="flex h-full flex-col items-center justify-center gap-4 px-4 text-center text-ink-muted"
          >
            <p>{{ t('pages.karte.loading') }}</p>
            <NuxtLink
              to="/liste"
              class="border-b border-atlas/40 pb-0.5 font-medium text-atlas-dark transition-colors hover:border-atlas-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-atlas-dark"
            >
              {{ t('pages.karte.to-list') }}
            </NuxtLink>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
