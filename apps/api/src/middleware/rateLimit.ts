import { Context, Next } from 'hono'

/**
 * Basic rate limiting middleware
 * Limits requests per IP address using in-memory storage
 *
 * Note: For production, use Cloudflare Rate Limiting or Durable Objects
 * This is a simple implementation for development
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // 100 requests per minute

export async function rateLimit(c: Context, next: Next) {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
  const now = Date.now()

  // Clean up expired entries
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }

  const entry = rateLimitMap.get(ip)

  if (!entry) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    })
  } else if (entry.resetAt < now) {
    // Reset window
    entry.count = 1
    entry.resetAt = now + WINDOW_MS
  } else if (entry.count >= MAX_REQUESTS) {
    // Rate limit exceeded
    return c.json({
      error: 'Too many requests',
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }, 429)
  } else {
    entry.count++
  }

  await next()
}
