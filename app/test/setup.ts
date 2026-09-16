import { config } from '@vue/test-utils'
import { vi } from 'vitest'
import { createI18n } from 'vue-i18n'

import de from '../locales/de.json'

// The i18n messages are loaded by a Nuxt plugin at runtime, and mountSuspended
// does not run it — without this every t() call would render its own key and the
// specs would have to assert on key names. Installing the real catalogue instead
// means a spec that asserts on German text also proves the key exists: delete an
// entry from de.json and the test fails, which is exactly the coupling we want.
config.global.plugins.push(
  createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: { de } }),
)

// Nuxt's app manifest fires a timer that calls $fetch — stub it so the test
// environment does not blow up with "ReferenceError: $fetch is not defined".
// Only when there is nothing there yet: the nuxt environment installs its own
// $fetch, and overwriting it would cut registerEndpoint() off from its server.
// The cast is what makes that check expressible — the global is declared as
// always present.
const globals = globalThis as { $fetch?: typeof $fetch }
globals.$fetch ??= vi.fn().mockResolvedValue({}) as typeof $fetch

// Vue warnings and errors are bugs, not noise: turn them into test failures.
config.global.config.warnHandler = (msg, _instance, trace) => {
  throw new Error(`[Vue warn]: ${msg}\n${trace}`)
}
config.global.config.errorHandler = (err) => {
  throw err instanceof Error ? err : new Error(String(err))
}
