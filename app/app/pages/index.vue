<script setup lang="ts">
  const { t } = useI18n()

  useHead({
    title: t('pages.index.title'),
    meta: [{ name: 'description', content: t('pages.index.description') }],
  })
</script>

<template>
  <section>
    <h1 class="text-3xl font-bold">{{ t('pages.index.title') }}</h1>
    <p class="mt-4">{{ t('pages.index.intro') }}</p>
    <p class="mt-8">
      <AppLink to="/impressum">{{ t('pages.index.imprint-link') }}</AppLink>
    </p>
  </section>
</template>
