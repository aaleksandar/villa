import { Hono } from 'hono'
import { cors } from './middleware/cors'
import { rateLimit } from './middleware/rateLimit'
import health from './routes/health'

/**
 * Villa API
 * Hono-based API service for Villa identity and storage
 */

const app = new Hono()

// Middleware
app.use('*', cors)
app.use('*', rateLimit)

// Error handling
app.onError((err, c) => {
  console.error('Unhandled error:', err)

  return c.json({
    error: 'Internal server error',
    message: err.message,
  }, 500)
})

// Routes
app.route('/health', health)

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Villa API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
    },
  })
})

export default app
