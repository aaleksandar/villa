import { Context, Next } from 'hono'

/**
 * CORS middleware for villa.cash origins
 * Allows requests from villa.cash domain and subdomains
 */
export async function cors(c: Context, next: Next) {
  const origin = c.req.header('Origin')

  // Allow villa.cash and its subdomains
  const allowedOrigins = [
    'https://villa.cash',
    'https://www.villa.cash',
    /^https:\/\/.*\.villa\.cash$/,
  ]

  const isAllowed = allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed
    }
    return origin && allowed.test(origin)
  })

  if (isAllowed && origin) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    c.header('Access-Control-Max-Age', '86400')
  }

  // Handle preflight
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  await next()
}
