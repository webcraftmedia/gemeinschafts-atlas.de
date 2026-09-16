<script setup lang="ts">
  /** Für Textseiten: zentrierte Spalte, Fußzeile darunter. */
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <main id="main" class="mx-auto w-full max-w-2xl grow px-4 py-16">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
