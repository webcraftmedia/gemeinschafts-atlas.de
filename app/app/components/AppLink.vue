<script setup lang="ts">
  /**
   * One link component for all three kinds of target, so the decisions that are
   * easy to get wrong are made once instead of per call site:
   *
   *   /impressum            internal  → NuxtLink, client-side navigation
   *   https://example.org   external  → new tab, rel="noopener noreferrer",
   *                                     and a hint that says so to a screen reader
   *   mailto: / tel:        external  → plain link, but NOT in a new tab: handing
   *                                     a mail client to a blank browser tab
   *                                     leaves the user staring at one
   */
  const props = defineProps<{ to: string }>()

  const { t } = useI18n()

  const isInternal = computed(() => props.to.startsWith('/'))
  /** Only a web page can meaningfully be opened in a tab. */
  const opensNewTab = computed(() => /^https?:\/\//.test(props.to))
</script>

<template>
  <NuxtLink v-if="isInternal" :to="to" class="text-atlas underline hover:text-atlas-dark">
    <slot />
  </NuxtLink>
  <a
    v-else
    :href="to"
    :target="opensNewTab ? '_blank' : undefined"
    :rel="opensNewTab ? 'noopener noreferrer' : undefined"
    class="text-atlas underline hover:text-atlas-dark"
  >
    <slot />
    <span v-if="opensNewTab" class="sr-only"> {{ t('components.AppLink.opens-new-tab') }}</span>
  </a>
</template>
