/**
 * Globals for server-side unit tests.
 *
 * Nitro auto-imports the h3 helpers into everything under server/, so the modules
 * there reference `defineEventHandler`, `getQuery` & co. without importing them.
 * Under vitest there is no Nitro, so the same helpers are installed as globals
 * here. Import this file from any spec that exercises a server module:
 *
 *   // @vitest-environment node
 *   import '../../test/setup-server'
 *
 * The real h3 implementations are used rather than stubs: header handling and
 * error shapes are part of what the tests are checking, and a stub would only
 * prove that the stub works.
 */
import {
  createError,
  defineEventHandler,
  getQuery,
  getRequestHeader,
  getRequestURL,
  getRouterParam,
  readBody,
  setResponseHeader,
  setResponseStatus,
} from 'h3'

Object.assign(globalThis, {
  createError,
  defineEventHandler,
  getQuery,
  getRequestHeader,
  getRequestURL,
  getRouterParam,
  readBody,
  setResponseHeader,
  setResponseStatus,
  // Nitro's plugin wrapper is a plain pass-through at runtime.
  defineNitroPlugin: <T>(handler: T) => handler,
})
