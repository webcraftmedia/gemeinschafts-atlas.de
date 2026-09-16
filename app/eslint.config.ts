import vueI18n from '@intlify/eslint-plugin-vue-i18n'
import {
  eslint as it4cEslint,
  security,
  comments,
  json,
  yaml,
  vitest,
  prettier,
  typescript as it4cTypescript,
  vue3 as it4cVue3,
  importX as it4cImportX,
  node as it4cNode,
  promise as it4cPromise,
} from 'eslint-config-it4c'

import withNuxt from './.nuxt/eslint.config.mjs'

/*
 * Nuxt and it4c both want to own the plugin and parser setup, and running both
 * would register the same plugins twice. The resolution below is the one from
 * the sibling projects: Nuxt provides plugins and parsers, and only the *rules*
 * of the it4c modules that overlap with it are adopted. Self-contained it4c
 * modules (node, promise, security, …) are spread in whole.
 */

// it4c ESLint base rules (recommended + custom, no plugin/parser overlap with Nuxt)
const it4cEslintRules = Object.assign({}, ...it4cEslint.map((c) => c.rules))

// it4c TypeScript rules (plugin/parser setup is provided by Nuxt via tsconfigPath)
const it4cTsRules = Object.assign({}, ...it4cTypescript.map((c) => c.rules))

// it4c Vue3 rules (plugin/parser setup is provided by Nuxt)
const it4cVue3Rules = Object.assign({}, ...it4cVue3.map((c) => c.rules))

// it4c import-x rules, renamed to Nuxt's plugin name `import`
// (Nuxt registers eslint-plugin-import-x as `import`, it4c as `import-x`)
const it4cImportRules = Object.fromEntries(
  Object.entries(Object.assign({}, ...it4cImportX.map((c) => c.rules))).map(([key, value]) => [
    key.replace('import-x/', 'import/'),
    value,
  ]),
)

// The settings must come along: they select the TypeScript resolver. Without them
// eslint-plugin-import-x falls back to its legacy `node` resolver, which crashes
// import/no-cycle. Settings keys stay `import-x/*` — the plugin reads them by that
// name regardless of the alias Nuxt registers it under.
const it4cImportSettings = Object.assign({}, ...it4cImportX.map((c) => c.settings))

// no-catch-all ships with the it4c eslint base module. Since only the rules of the
// it4c modules are adopted here (Nuxt provides plugins/parser), its plugin has to be
// registered alongside them.
const it4cEslintPlugins = Object.assign({}, ...it4cEslint.map((c) => c.plugins))

export default withNuxt(
  /*
   * CSS is deliberately not linted by ESLint.
   *
   * Two reasons, both structural rather than a matter of taste. Nuxt's own
   * config applies eslint:recommended without a file restriction, so the JS
   * rules land on .css files and the first one that asks the source for its
   * comments crashes the run. And @eslint/css does not know Tailwind 4's
   * CSS-first syntax — `@theme` alone trips no-invalid-at-rules — so the rules
   * that survived would mostly be wrong.
   *
   * What is lost is small: Tailwind means the styling lives in the templates,
   * where the Vue rules already apply, and Prettier still formats the stylesheet.
   * Should hand-written CSS grow into something substantial, the answer is
   * stylelint with stylelint-config-tailwindcss as its own gate, not this.
   */
  { ignores: ['.claude/', 'dist/', 'logs/', 'public/', '**/*.css'] },
  // it4c ESLint base rules
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,vue}'],
    plugins: it4cEslintPlugins,
    rules: it4cEslintRules,
  },
  {
    rules: {
      // The TypeScript equivalents (@typescript-eslint/*) do this job better
      'no-unused-vars': 'off',
      // TypeScript checks undefined statically; Nuxt auto-imports cause false positives
      'no-undef': 'off',
      // console.warn/error are legitimate error handling; console.log is not
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  // it4c Vue3 rules (plugin is provided by Nuxt)
  {
    files: ['**/*.vue', '**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    rules: it4cVue3Rules,
  },
  // it4c TypeScript rules (strictTypeChecked + custom rules)
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    rules: it4cTsRules,
  },
  // it4c import rules (plugin is provided by Nuxt as `import`)
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,vue}'],
    settings: it4cImportSettings,
    rules: it4cImportRules,
  },
  {
    rules: {
      // TypeScript + Nuxt aliases (~, #imports, #app) are not resolved
      'import/no-unresolved': 'off',
      // The Nuxt-generated export (withNuxt) is default and named at the same time
      'import/no-named-as-default': 'off',
      // Nuxt convention: relative parent imports (../components/) are common
      'import/no-relative-parent-imports': 'off',
      // .vue extensions are required in Nuxt
      'import/extensions': 'off',
      // Namespace imports for types (import type * as X) are common
      'import/no-namespace': 'off',
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      // Nuxt names pages and layouts after the file path — single-word names are correct
      'vue/multi-word-component-names': 'off',
    },
  },
  // it4c modules (self-contained, no Nuxt overlap)
  ...it4cNode,
  {
    // Build, test and script level read environment variables directly — inside the
    // app itself Nuxt's runtimeConfig does that, so the rule stays active there.
    files: ['*.config.ts', 'scripts/**', 'e2e/**'],
    rules: {
      'n/no-process-env': 'off',
    },
  },
  {
    // Maintenance scripts run without event-loop pressure and need console output
    files: ['scripts/**'],
    rules: {
      'n/no-sync': 'off',
      'no-console': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
  {
    // Nuxt generates the flat config as .mjs, the import needs the extension —
    // and so do the plain-ESM maintenance scripts, which node resolves itself.
    files: ['eslint.config.ts', 'scripts/**'],
    rules: {
      'n/file-extension-in-import': 'off',
    },
  },
  ...it4cPromise,
  {
    // Maintenance scripts wrap signal handlers and polling loops, which are
    // callback-based by nature and cannot be expressed as plain awaits.
    files: ['scripts/**'],
    rules: {
      'promise/avoid-new': 'off',
      'promise/param-names': 'off',
    },
  },
  ...security,
  {
    rules: {
      // Too many false positives on ordinary array/object access
      'security/detect-object-injection': 'off',
    },
  },
  ...comments,
  ...json,
  ...yaml,
  // The vitest module keys off **/*.spec.ts, which also matches the Playwright
  // specs under e2e/. Keep it away from them — they are a different runner.
  ...vitest.map((c) => ({ ...c, ignores: [...(c.ignores ?? []), 'e2e/**'] })),
  {
    files: ['e2e/**'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', 'test/**'],
    rules: {
      // Test-setup side-effect imports (import '../test/setup-server') are the point
      'import/no-unassigned-import': 'off',
      // devDependencies in tests are correct
      'import/no-extraneous-dependencies': 'off',
      // The project uses vitest globals via config
      'vitest/prefer-importing-vitest-globals': 'off',
      // Padding rules are noise for this codebase
      'vitest/padding-around-all': 'off',
      'vitest/padding-around-expect-groups': 'off',
      // Table-driven cases legitimately assert more than the default budget
      'vitest/max-expects': 'off',
      'vitest/prefer-lowercase-title': 'off',
      'vitest/prefer-describe-function-title': 'off',
      // Tests deliberately set globals and env vars
      'n/no-process-env': 'off',
    },
  },

  // vue-i18n. The message catalogues are only as trustworthy as the checks on
  // them: an unused key is dead weight, a missing one renders as its own id.
  ...vueI18n.configs.recommended,
  {
    rules: {
      '@intlify/vue-i18n/key-format-style': ['error', 'kebab-case', { splitByDots: false }],
      '@intlify/vue-i18n/no-duplicate-keys-in-locale': 'error',
      // A key built at runtime cannot be checked for existence by anything
      '@intlify/vue-i18n/no-dynamic-keys': 'error',
      '@intlify/vue-i18n/no-missing-keys-in-other-locales': 'error',
      '@intlify/vue-i18n/no-unknown-locale': 'error',
      '@intlify/vue-i18n/no-unused-keys': ['error', { extensions: ['.ts', '.vue'] }],
      '@intlify/vue-i18n/prefer-sfc-lang-attr': 'error',
      '@intlify/vue-i18n/prefer-linked-key-with-paren': 'error',
      '@intlify/vue-i18n/sfc-locale-attr': 'error',
    },
    settings: {
      'vue-i18n': {
        localeDir: './locales/*.{json}', // extension is glob formatting!
        // Specify the version of `vue-i18n` in use; without it the message
        // syntax is parsed twice.
        messageSyntaxVersion: '^11.0.0',
      },
    },
  },

  {
    // This file itself. The it4c modules ship as flat-config arrays whose rule
    // objects are typed `any`, so every reshaping above is an "unsafe" operation
    // as far as the type-aware rules are concerned. The relaxation is scoped to
    // this one file on purpose — nothing under app/ or server/ gets it.
    files: ['eslint.config.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    // Tool configs read process.env directly, and `||` is correct there: an
    // env var set to the empty string means "not configured", which `??` would
    // happily pass through.
    files: ['*.config.ts', 'scripts/**', 'e2e/**'],
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },

  // Prettier (MUST be last)
  ...prettier,
)
