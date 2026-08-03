/**
 * Signing secrets, read from the environment only.
 *
 * There are deliberately no fallback values. A signing key with a default
 * baked into the source is the same as no key at all — anyone holding the
 * source can mint a valid session token for any deployment that did not
 * override it. Missing configuration fails loudly instead.
 *
 * These are functions rather than module-level constants on purpose: Next.js
 * evaluates module scope during `next build`, which runs before the runtime
 * environment exists. Reading lazily keeps the build working while still
 * requiring a real value at request time.
 */

function readSecret(name: string): string {
  const value = process.env[name]?.trim()
  if (value) return value

  // Jest needs a deterministic value; this branch never runs in a deployment.
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
    return `test-only-${name.toLowerCase()}-not-for-deployment`
  }

  throw new Error(
    `${name} is not set. Generate one with: openssl rand -base64 32`
  )
}

export function jwtSecret(): string {
  return readSecret('JWT_SECRET')
}

/** Falls back to JWT_SECRET, as documented in .env.example. */
export function csrfSecret(): string {
  return process.env.CSRF_SECRET?.trim() || jwtSecret()
}
