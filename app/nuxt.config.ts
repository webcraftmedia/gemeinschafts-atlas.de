// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-16',
  devtools: { enabled: true },
  // Specs live next to the code they test, which puts them inside the directories
  // Nitro scans. Without this, server/plugins/*.spec.ts would be registered as a
  // plugin (and fail the build for want of a default export), server/middleware
  // specs would run on every request, and every server/api spec would become a
  // reachable endpoint.
  ignore: ['**/*.spec.ts'],
  modules: [
    // tsconfigPath enables type-aware linting, which the it4c TypeScript rules require
    ['@nuxt/eslint', { config: { typescript: { tsconfigPath: 'tsconfig.json' } } }],
    '@nuxt/test-utils/module',
    '@nuxtjs/i18n',
  ],
  i18n: {
    // Keep the message catalogues at the project root (app/locales/) instead of
    // the module's i18n/ default — that is where the locales lint gate looks.
    restructureDir: './',
    defaultLocale: 'de',
    locales: [{ code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' }],
    // One language, so there is nothing to negotiate and nothing to prefix.
    detectBrowserLanguage: false,
    strategy: 'no_prefix',
  },
  typescript: {
    // Root-level tool configs are TypeScript too — pull them into the node project
    // so type-aware linting can resolve them (paths are relative to .nuxt/).
    nodeTsConfig: {
      include: [
        '../eslint.config.ts',
        '../prettier.config.ts',
        '../vitest.config.ts',
        '../playwright.config.ts',
      ],
    },
    // Nuxt only picks up test/nuxt/**; our shared test setup lives in test/.
    tsConfig: {
      include: ['../test/**/*', '../e2e/**/*'],
    },
  },
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      // Deliberately config and not a translation: an address is data, it is the
      // same in every language, and vue-i18n reads `@` as its linked-message
      // operator. Overridable per environment so a staging deployment does not
      // publish the real inbox.
      contactEmail: process.env.NUXT_PUBLIC_CONTACT_EMAIL || 'kontakt@gemeinschafts-atlas.de',
      // Das Impressum der Betreiberin, extern verlinkt.
      imprintUrl: process.env.NUXT_PUBLIC_IMPRINT_URL || 'https://webcraft-media.de/#!impressum',
      // Vector-Tiles für die Karte. OpenFreeMap: kein Key, keine Registrierung,
      // keine Cookies, keine Limits, EU-Hosting. Konfigurierbar, damit ein
      // Umzug auf selbst gehostete PMTiles eine URL-Änderung bleibt und kein
      // Umbau — siehe docs/karte.md.
      tilesUrl: process.env.NUXT_PUBLIC_TILES_URL || 'https://tiles.openfreemap.org/planet',
      glyphsUrl:
        process.env.NUXT_PUBLIC_GLYPHS_URL ||
        'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    },
  },
  css: ['~/assets/css/main.css'],
  // Tailwind 4 is configured from CSS (see assets/css/main.css); the Vite plugin
  // is all the build needs. No tailwind.config.ts, no Nuxt module.
  vite: {
    plugins: [tailwindcss()],
    build: {
      /*
       * Kein Eingriff ins Chunking. Zwei Versuche, MapLibre in einen eigenen,
       * benannten Chunk zu zwingen, sind hier gescheitert — beide nachgemessen:
       *
       *   output.chunkFileNames  ließ den Client-Build in eine einzige Datei
       *                          kollabieren (12 Chunks → 1).
       *   output.codeSplitting   zog maplibre-gl-worker.mjs in den Sammelchunk,
       *                          statt es als eigene Datei auszugeben. Die Karte
       *                          blieb dann leer: Canvas da, aber ohne Worker
       *                          dekodiert niemand die Vector Tiles.
       *
       * Der zweite Fall ist der lehrreichere — er war im Build unsichtbar und
       * wäre ohne einen Blick auf die gerenderte Seite durchgegangen. Nuxt teilt
       * von sich aus korrekt auf; das Budget in .size-limit.json misst deshalb
       * die Summe statt einzelner Chunks.
       */
      // Vite warnt ab 500 kB und rät zu dynamischem Import — was hier bereits
      // geschieht: Die Karte wird erst in onMounted geladen. Die Warnung kann
      // das nicht wissen. Angehoben statt stummgeschaltet, damit sie bei
      // *unbeabsichtigtem* Wachstum weiter greift.
      chunkSizeWarningLimit: 1200,
    },
  },
  ssr: true,
  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
