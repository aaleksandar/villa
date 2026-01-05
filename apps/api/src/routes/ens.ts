import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '../db/client'

const ens = new Hono()

/**
 * ENS CCIP-Read gateway for offchain resolution
 * Implements EIP-3668: CCIP Read
 *
 * This allows ENS names like alice.villa.eth to resolve
 * using our offchain database instead of on-chain storage.
 */

// Supported ENS suffixes
const ENS_SUFFIXES = ['.villa.eth', '.proofofretreat.eth'] as const

/**
 * Normalize nickname to lowercase alphanumeric
 */
function normalizeNickname(nickname: string): string {
  return nickname
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, '') // Keep only alphanumeric
}

/**
 * Extract nickname from ENS name
 * alice.villa.eth -> alice
 * bob.proofofretreat.eth -> bob
 */
function extractNickname(ensName: string): string | null {
  const lowerName = ensName.toLowerCase()

  for (const suffix of ENS_SUFFIXES) {
    if (lowerName.endsWith(suffix)) {
      const nickname = lowerName.slice(0, -suffix.length)
      if (nickname.length > 0) {
        return nickname
      }
    }
  }

  return null
}

/**
 * Check if database is available
 */
function useDatabase(): boolean {
  return !!process.env.DATABASE_URL
}

/**
 * In-memory fallback storage (used when DATABASE_URL not set)
 */
const nicknameStore = new Map<string, string>()
const addressStore = new Map<string, string>()

/**
 * GET /ens/resolve
 * CCIP-Read compatible resolver endpoint
 *
 * Query params:
 * - sender: address (ENS resolver contract)
 * - data: bytes (encoded resolver call)
 *
 * Returns CCIP-Read format (EIP-3668):
 * {
 *   data: "0x..." // ABI-encoded response
 * }
 */
ens.get('/resolve', async (c) => {
  try {
    const sender = c.req.query('sender')
    const data = c.req.query('data')

    if (!sender || !data) {
      return c.json(
        {
          error: 'Missing required parameters: sender, data',
        },
        400
      )
    }

    // TODO: Full CCIP-Read implementation
    // For now, return empty data (indicates no resolution)
    // A full implementation would:
    // 1. Decode the resolver call from `data` (e.g., addr(node), name(node), text(node, key))
    // 2. Convert node to ENS name using reverse lookup or passed context
    // 3. Query database for the corresponding value
    // 4. ABI-encode the response

    return c.json({
      data: '0x',
    })
  } catch (error) {
    console.error('ENS CCIP resolution error:', error)
    return c.json(
      {
        error: 'Failed to resolve ENS name',
      },
      500
    )
  }
})

/**
 * POST /ens/resolve
 * Alternative endpoint for CCIP-Read (some clients use POST)
 */
ens.post('/resolve', async (c) => {
  try {
    const body = await c.req.json()
    const { sender, data } = body

    if (!sender || !data) {
      return c.json(
        {
          error: 'Missing required fields: sender, data',
        },
        400
      )
    }

    // Same as GET endpoint
    return c.json({
      data: '0x',
    })
  } catch (error) {
    console.error('ENS CCIP resolution error:', error)
    return c.json(
      {
        error: 'Failed to resolve ENS name',
      },
      500
    )
  }
})

/**
 * GET /ens/addr/:name
 * Simplified address resolution (non-CCIP-Read format)
 * Useful for direct API calls
 *
 * Example: /ens/addr/alice.villa.eth
 */
ens.get('/addr/:name', async (c) => {
  const name = c.req.param('name')
  const nickname = extractNickname(name)

  if (!nickname) {
    return c.json(
      {
        error: `Invalid ENS name format. Expected: {nickname}.villa.eth or {nickname}.proofofretreat.eth`,
      },
      400
    )
  }

  const normalized = normalizeNickname(nickname)

  if (useDatabase()) {
    const db = getDb()
    const [profile] = await db
      .select({
        address: schema.profiles.address,
        nickname: schema.profiles.nickname,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.nicknameNormalized, normalized))
      .limit(1)

    if (!profile) {
      return c.json(
        {
          error: 'ENS name not found',
          name,
          nickname: normalized,
        },
        404
      )
    }

    return c.json({
      name,
      address: profile.address,
      nickname: profile.nickname,
    })
  } else {
    const address = nicknameStore.get(normalized)

    if (!address) {
      return c.json(
        {
          error: 'ENS name not found',
          name,
          nickname: normalized,
        },
        404
      )
    }

    return c.json({
      name,
      address,
      nickname: normalized,
    })
  }
})

/**
 * GET /ens/name/:address
 * Reverse resolution (address to ENS name)
 * Simplified, non-CCIP-Read format
 *
 * Example: /ens/name/0x1234...
 */
ens.get('/name/:address', async (c) => {
  const address = c.req.param('address')
  const normalizedAddress = address.toLowerCase()

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return c.json(
      {
        error: 'Invalid Ethereum address format',
      },
      400
    )
  }

  if (useDatabase()) {
    const db = getDb()
    const [profile] = await db
      .select({
        address: schema.profiles.address,
        nickname: schema.profiles.nickname,
        avatarStyle: schema.profiles.avatarStyle,
        avatarSeed: schema.profiles.avatarSeed,
        avatarGender: schema.profiles.avatarGender,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.address, normalizedAddress))
      .limit(1)

    if (!profile || !profile.nickname) {
      return c.json(
        {
          error: 'No ENS name found for this address',
        },
        404
      )
    }

    return c.json({
      address: profile.address,
      name: `${profile.nickname}.villa.eth`,
      nickname: profile.nickname,
      avatar: profile.avatarStyle
        ? {
            style: profile.avatarStyle,
            seed: profile.avatarSeed,
            gender: profile.avatarGender,
          }
        : null,
    })
  } else {
    const nickname = addressStore.get(normalizedAddress)

    if (!nickname) {
      return c.json(
        {
          error: 'No ENS name found for this address',
        },
        404
      )
    }

    return c.json({
      address: normalizedAddress,
      name: `${nickname}.villa.eth`,
      nickname,
    })
  }
})

export default ens
