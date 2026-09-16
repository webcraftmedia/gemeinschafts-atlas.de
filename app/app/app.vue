<script setup lang="ts">
  const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <NuxtRouteAnnouncer />
    <!--
      First thing in the tab order, invisible until focused: a keyboard user must
      be able to skip the navigation without tabbing through it. WCAG 2.4.1.
    -->
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-atlas focus:px-4 focus:py-2 focus:text-white"
    >
      {{ t('app.skip-to-content') }}
    </a>
    <!-- NuxtPage muss *in* NuxtLayout stehen: der Slot ist es, den die Layouts
         rendern. Ohne ihn kommt das Layout, aber keine Seite. -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
