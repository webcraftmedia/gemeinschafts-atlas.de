/**
 * Recognises consola's warning and error lines — in both formats it uses.
 *
 * This is the part that is easy to get wrong, so it lives in one place: consola
 * picks its reporter by whether stdout is a TTY. Locally that is the fancy one
 *
 *     WARN  Duplicated imports "getSession" ...
 *
 * while CI has no TTY and gets the basic one
 *
 *     [warn] Duplicated imports "getSession" ...
 *
 * Colours are on in both cases, so the tags arrive wrapped in escape sequences.
 * A check that only knows one of these shapes passes everything in the other —
 * a gate that never fails, which is worse than no gate.
 */

/**
 * ESC is built from its code point rather than written into the pattern as a
 * raw byte or a \x1B escape: a raw byte does not survive copy-paste through
 * editors and diffs, and an escape would trip no-control-regex for a reason
 * that does not apply here.
 */
const ESC = String.fromCharCode(27)
/* ESC is a module-level constant, not input — nothing reaches this from outside. */
// eslint-disable-next-line security/detect-non-literal-regexp
const ANSI_COLOUR = new RegExp(`${ESC}\\[[0-9;]*m`, 'g')

/** Colour codes sit between the words we match on, so they have to go first. */
export function stripAnsi(line) {
  return line.replace(ANSI_COLOUR, '')
}

const WARN_OR_ERROR = /(?:^|\s)(?:WARN|ERROR)\s|\[(?:warn|error)\]/i
const ERROR_ONLY = /(?:^|\s)ERROR\s|\[error\]/i

export function isWarnOrError(line) {
  return WARN_OR_ERROR.test(stripAnsi(line))
}

export function isError(line) {
  return ERROR_ONLY.test(stripAnsi(line))
}
