<script setup lang="ts">
  const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900">
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
    <main id="main" class="mx-auto max-w-2xl px-4 py-16">
      <NuxtPage />
    </main>
  </div>
</template>
