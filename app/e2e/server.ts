/**
 * Where the suite expects the application under test.
 *
 * Shared by playwright.config.ts (which starts the server) and
 * e2e/global-setup.ts (which checks that the thing answering really is ours),
 * so the two can never drift apart.
 */
export const PORT = Number(process.env.E2E_PORT ?? 3188)
export const BASE_URL = `http://127.0.0.1:${String(PORT)}`
