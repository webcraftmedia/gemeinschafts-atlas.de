<script setup lang="ts">
  /**
   * Für die Startseite: keine Spaltenbreite, die Seite setzt ihre Abschnitte
   * selbst.
   *
   * Der Unterschied zu `default` ist genau einer, aber ein tragender: die
   * Karten-Bühne muss randlos über die ganze Fensterbreite gehen und klebend
   * 100 dvh hoch sein. In einer zentrierten Spalte ginge das nur mit negativen
   * Rändern — einem Trick, der bei jeder Änderung der Spaltenbreite neu
   * nachgerechnet werden müsste. `default` bleibt deshalb, was es ist: das
   * Layout für Textseiten.
   */
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <main id="main" class="grow">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
