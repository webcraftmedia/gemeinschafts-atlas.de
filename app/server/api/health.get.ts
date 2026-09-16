/**
 * Liveness endpoint for the deploy webhook and any external monitoring.
 *
 * Deliberately does no work beyond proving that Nitro is answering: a health
 * check that queries a backing service turns every hiccup there into "the app
 * is down" and, worse, gives a monitoring system a cheap way to hammer it.
 * Checks of dependencies belong in their own endpoint, with their own budget.
 */
export default defineEventHandler(() => ({
  status: 'ok' as const,
  timestamp: new Date().toISOString(),
}))
