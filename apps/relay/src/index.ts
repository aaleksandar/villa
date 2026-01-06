import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { checkHealth } from './health'
import { shouldSponsor, getDefaultMerchantConfig } from './merchant'
import type { RelayRequest, RelayResponse } from './types'

const app = new Hono()

// CORS configuration - allow Villa domains
app.use('*', cors({
  origin: [
    'https://villa.cash',
    'https://beta.villa.cash',
    'https://dev-1.villa.cash',
    'https://dev-2.villa.cash',
    'http://localhost:3000'
  ],
  credentials: true
}))

// Health check endpoint
app.get('/health', async (c) => {
  const health = await checkHealth()
  const status = health.status === 'ok' ? 200 : 503
  return c.json(health, status)
})

// Porto relay endpoint
app.post('/relay', async (c) => {
  try {
    const request = await c.req.json<RelayRequest>()

    // Validate request structure
    if (!request.operation || !request.target || !request.signature) {
      return c.json<RelayResponse>({
        success: false,
        error: 'Invalid request: missing required fields'
      }, 400)
    }

    // Check if operation should be sponsored
    const merchantConfig = getDefaultMerchantConfig()
    const sponsor = shouldSponsor(request.operation, merchantConfig)

    if (!sponsor) {
      return c.json<RelayResponse>({
        success: false,
        error: 'Operation not eligible for gas sponsoring'
      }, 403)
    }

    // BLOCKED: Porto bundler integration pending SDK v2 release
    //
    // Implementation steps when Porto SDK v2 is available:
    // 1. Import Porto bundler client: import { createBundlerClient } from 'porto/bundler'
    // 2. Create UserOperation from request.operation:
    //    - sender: request.target (smart account address)
    //    - callData: encoded transaction
    //    - signature: request.signature (passkey signature)
    // 3. Submit to Porto bundler: bundler.sendUserOperation(userOp)
    // 4. Wait for inclusion: bundler.waitForUserOperationReceipt(hash)
    // 5. Return actual transaction hash
    //
    // Gas sponsorship:
    // - If shouldSponsor() returns true, attach paymaster data
    // - Paymaster address from PORTO_PAYMASTER_ADDRESS env var
    //
    // Reference: https://porto.sh/sdk/bundler
    // For now, return mock response
    return c.json<RelayResponse>({
      success: true,
      txHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    })

  } catch (error) {
    console.error('Relay error:', error)
    return c.json<RelayResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Start server
const port = parseInt(process.env.PORT || '3001', 10)

export default {
  port,
  fetch: app.fetch,
}

// For Node.js standalone usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`🚀 Porto Relay starting on port ${port}`)
  console.log(`   Chain: ${process.env.CHAIN_ENV === 'testnet' ? 'Base Sepolia' : 'Base'}`)
  console.log(`   Health: http://localhost:${port}/health`)
}
