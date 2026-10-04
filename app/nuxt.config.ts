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
      // Die Datenschutzerklärung der Betreiberin, ebenfalls extern verlinkt.
      privacyUrl: process.env.NUXT_PUBLIC_PRIVACY_URL || 'https://webcraft-media.de/#!datenschutz',
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
      // Vite warnt ab 500 kB und rät zu dynamischem Import — was hier bereits
      // geschieht: Die Karte wird erst in onMounted geladen. Die Warnung kann
      // das nicht wissen. Angehoben statt stummgeschaltet, damit sie bei
      // *unbeabsichtigtem* Wachstum weiter greift.
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        checks: {
          /*
           * Rolldowns Zeitmessung abschalten — die Quelle, nicht die Meldung.
           *
           * Vite 8 bündelt mit Rolldown, und das meldet
           * `[PLUGIN_TIMINGS] Plugin hooks ran for 8.7s of this 10.3s build
           * (84%)`, sobald Plugins den Löwenanteil der Bauzeit ausmachen. Bei
           * einem Projekt dieser Größe ist das immer so: die langsamsten Hooks
           * sind `vite:css transform` und `vite:worker load`, also Tailwind und
           * MapLibres Worker — beides gewollt, beides nicht wegzuoptimieren.
           *
           * Für `scripts/build-strict.mjs` ist jede WARN-Zeile ein Fehler, und
           * das zu Recht: Nuxt meldet echte Probleme als Warnung und steigt
           * trotzdem mit 0 aus. Diese Zeile ist aber keine Aussage über das
           * Projekt, sondern über ein Zeitverhältnis — je schneller der Build,
           * desto eher erscheint sie. Sie war damit zugleich dauerhaft rot und
           * maschinenabhängig.
           *
           * Deshalb hier und nicht in der ACCEPTED-Liste des Skripts: eine
           * Warnung, die nie entsteht, muss niemand später wieder bewerten.
           * Die übrigen `checks` bleiben unangetastet und scharf.
           */
          pluginTimings: false,
        },
        output: {
          /*
           * MapLibre bekommt einen eigenen, *benannten* Chunk — nicht fürs
           * Bündeln, sondern fürs Messen.
           *
           * Nuxt teilt von sich aus richtig auf: die Bibliothek liegt längst in
           * einer eigenen Datei, die nur lädt, wer die Karte zu sehen bekommt.
           * Nur hieß diese Datei `z8p6gKBF.js`, und ein Budget kann nicht
           * messen, was es nicht benennen kann. `.size-limit.json` hatte
           * deshalb einen einzigen Eintrag über alles und eine Beschriftung,
           * die den Anteil schätzte — um mehr als das Doppelte daneben.
           *
           * Zwei frühere Anläufe sind hier gescheitert und stehen als Warnung
           * für den nächsten Versuch: `output.chunkFileNames` ohne `[name]`
           * oder `[hash]` ließ den Client-Build in eine einzige Datei
           * kollabieren, und `output.codeSplitting` zog
           * maplibre-gl-worker.mjs in den Sammelchunk. Der zweite Fall ist der
           * gefährlichere: Er ist im Build unsichtbar, und die Karte bleibt
           * leer — Canvas und Marker da, aber ohne Worker dekodiert niemand die
           * Vector Tiles. Genau das prüft `e2e/smoke.spec.ts` gegen das Netz.
           *
           * Der Unterschied zu damals ist die *Gruppe*: `codeSplitting` wird
           * nicht an- oder abgeschaltet, sondern bekommt eine einzige Regel für
           * genau ein Paket. Alles andere teilt Nuxt weiter selbst auf.
           * Nachgemessen am 29.09.2026: der Worker kommt unverändert als eigene
           * Datei heraus, gleiche Größe wie vorher.
           */
          chunkFileNames: '_nuxt/[name]-[hash].js',
          codeSplitting: {
            groups: [{ name: 'maplibre', test: /[\\/]node_modules[\\/]maplibre-gl[\\/]/ }],
          },
        },
      },
    },
  },
  ssr: true,
  app: {
    head: {
      // scroll-smooth: Der Weg von der Erklärung zur Karte ist ein Sprung auf
      // #karte, und ein Sprung ohne Weg sieht aus wie ein Seitenwechsel — genau
      // das, was hier abgeschafft wurde. Die reduced-motion-Regel in main.css
      // nimmt es wieder zurück, wer das eingestellt hat.
      htmlAttrs: { lang: 'de', class: 'scroll-smooth' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
