import { Readable } from 'node:stream'

import { createEvent } from 'h3'
import { vi } from 'vitest'

import type { EventHandler, H3Event } from 'h3'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Builds a real H3 event for testing a Nitro route handler.
 *
 * A real event rather than a stub, so `readBody`, `getQuery` and `getRouterParam`
 * behave exactly as they do in production — including their parsing and error
 * cases, which is a large part of what the handler specs are checking.
 */
export interface TestEventOptions {
  method?: string
  /** Path with query string, e.g. `/api/health?verbose=1`. */
  url?: string
  /** What `getRouterParam` should return, e.g. `{ id: '55' }`. */
  params?: Record<string, string>
  headers?: Record<string, string>
  /** Serialised as JSON; use a string to send a malformed body on purpose. */
  body?: unknown
}

export function createTestEvent(options: TestEventOptions = {}): H3Event {
  const raw =
    options.body === undefined
      ? undefined
      : typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body)

  const req = Readable.from(
    raw === undefined ? [] : [Buffer.from(raw)],
  ) as unknown as IncomingMessage
  Object.assign(req, {
    method: options.method ?? 'GET',
    url: options.url ?? '/',
    headers: {
      host: 'gemeinschafts-atlas.de',
      // content-length is not cosmetic: without it (or chunked encoding) h3's
      // readRawBody returns undefined without ever touching the stream.
      ...(raw === undefined
        ? {}
        : {
            'content-type': 'application/json',
            'content-length': String(Buffer.byteLength(raw)),
          }),
      ...options.headers,
    },
    socket: { remoteAddress: '127.0.0.1' },
  })

  const res = {
    setHeader: vi.fn(),
    getHeader: vi.fn(),
    getHeaderNames: vi.fn(() => []),
    removeHeader: vi.fn(),
    headersSent: false,
    statusCode: 200,
  }

  const event = createEvent(req, res as unknown as ServerResponse)
  if (options.params) event.context.params = options.params
  return event
}

/** Calls a route handler with a freshly built event and returns its result. */
export async function callHandler<T>(
  handler: EventHandler,
  options: TestEventOptions = {},
): Promise<T> {
  return (await handler(createTestEvent(options))) as T
}
