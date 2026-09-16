import { request } from '@playwright/test'

import { BASE_URL, PORT } from './server'

/**
 * Proves that the server on the E2E port is this application.
 *
 * `reuseExistingServer` only asks whether *something* answers the URL, so an
 * unrelated service that happens to hold the port is silently accepted and the
 * whole suite then tests the wrong app — with failures that point at our pages
 * rather than at the port. This ran into exactly that, which is why the check
 * exists rather than a comment saying "watch out for port collisions".
 *
 * /api/health is the cheapest thing that only we answer.
 */
export default async function globalSetup(): Promise<void> {
  const context = await request.newContext({ baseURL: BASE_URL })
  try {
    const response = await context.get('/api/health')
    const body: unknown = response.ok() ? await response.json() : null
    if ((body as { status?: string } | null)?.status !== 'ok') {
      throw new Error(
        `Something is listening on port ${String(PORT)}, but it is not this app:` +
          ` GET /api/health answered ${String(response.status())}.\n` +
          'Stop whatever holds the port, or point the suite elsewhere with E2E_PORT.',
      )
    }
  } finally {
    await context.dispose()
  }
}
