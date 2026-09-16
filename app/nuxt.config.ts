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
    },
  },
  css: ['~/assets/css/main.css'],
  // Tailwind 4 is configured from CSS (see assets/css/main.css); the Vite plugin
  // is all the build needs. No tailwind.config.ts, no Nuxt module.
  vite: {
    plugins: [tailwindcss()],
  },
  ssr: true,
  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
