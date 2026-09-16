<script setup lang="ts">
  const { t } = useI18n()
  const { imprintUrl } = useRuntimeConfig().public
</script>

<template>
  <footer class="border-t border-ink/10 px-4 py-6 text-sm text-ink/70">
    <div class="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2">
      <span>{{ t('app.brand') }}</span>
      <!-- Das Impressum der Betreiberin, bewusst extern statt dupliziert. -->
      <AppLink :to="imprintUrl">{{ t('app.imprint') }}</AppLink>
    </div>
  </footer>
</template>
