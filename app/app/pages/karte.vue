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
      liefert serverseitig den Fallback aus — der ist kein Spinner, sondern die
      Liste: Wer ohne JavaScript kommt (oder mit einem Screenreader arbeitet),
      bekommt damit sofort den vollständigen Inhalt statt einer Entschuldigung.
    -->
    <div class="h-[100dvh] w-full">
      <ClientOnly>
        <CommunityMap :communities="communities" />
        <template #fallback>
          <div class="flex h-full items-center justify-center px-4 text-center text-ink/60">
            {{ t('pages.karte.loading') }}
          </div>
        </template>
      </ClientOnly>
    </div>

    <CommunityList :communities="communities" />
  </div>
</template>
