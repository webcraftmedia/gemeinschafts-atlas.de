<script setup lang="ts">
  const { t } = useI18n()
  const { imprintUrl, privacyUrl } = useRuntimeConfig().public
</script>

<template>
  <footer class="border-t border-ink/10 px-4 py-6 text-sm text-ink-muted">
    <div class="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2">
      <span>{{ t('app.brand') }}</span>
      <!-- Impressum und Datenschutzerklärung der Betreiberin, bewusst extern statt dupliziert. -->
      <span class="flex gap-4">
        <AppLink :to="imprintUrl">{{ t('app.imprint') }}</AppLink>
        <AppLink :to="privacyUrl">{{ t('app.privacy') }}</AppLink>
      </span>
    </div>
  </footer>
</template>
