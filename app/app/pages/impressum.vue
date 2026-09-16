<script setup lang="ts">
  /**
   * Required by § 5 DDG for any German business website — present from the first
   * commit on purpose, because a site that goes live without one is unlawful and
   * "we add it later" is how that happens. The contents below are placeholders;
   * fill them in before the first public deployment.
   */
  const { t } = useI18n()
  const { contactEmail } = useRuntimeConfig().public

  useHead({ title: t('pages.impressum.title') })
</script>

<template>
  <section>
    <h1 class="text-3xl font-bold">{{ t('pages.impressum.title') }}</h1>

    <h2 class="mt-8 text-xl font-semibold">{{ t('pages.impressum.provider-heading') }}</h2>
    <p class="mt-2 whitespace-pre-line">{{ t('pages.impressum.provider-address') }}</p>

    <h2 class="mt-8 text-xl font-semibold">{{ t('pages.impressum.contact-heading') }}</h2>
    <p class="mt-2">
      <AppLink :to="`mailto:${contactEmail}`">{{ contactEmail }}</AppLink>
    </p>

    <p class="mt-8">
      <AppLink to="/">{{ t('pages.impressum.back-link') }}</AppLink>
    </p>
  </section>
</template>
