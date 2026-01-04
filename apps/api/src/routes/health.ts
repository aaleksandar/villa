import { Hono } from 'hono'

const health = new Hono()

/**
 * Health check endpoint
 * Returns service status and version
 */
health.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'villa-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  })
})

export default health
