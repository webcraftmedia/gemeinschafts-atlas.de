// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest'

import '../../test/setup-server'
import { callHandler } from '../../test/helpers/event'

import healthEndpoint from './health.get'

interface Health {
  status: 'ok'
  timestamp: string
}

describe('GET /api/health', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports ok with the current time in UTC ISO form', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-16T08:30:00.000Z'))

    const body = await callHandler<Health>(healthEndpoint, { url: '/api/health' })

    expect(body.status).toBe('ok')
    // The exact format matters: monitoring parses it, and a locale-dependent
    // string would silently change with the server's TZ.
    expect(body.timestamp).toBe('2026-09-16T08:30:00.000Z')
  })

  it('answers without touching the request', async () => {
    // A liveness probe that depends on anything can report "down" for a reason
    // that has nothing to do with the process being alive. An empty event is
    // enough for it, and that is the property worth pinning.
    const body = await callHandler<Health>(healthEndpoint)

    expect(body.status).toBe('ok')
  })
})
