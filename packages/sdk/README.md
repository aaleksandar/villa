# @rockfridrich/villa-sdk

Privacy-first passkey authentication for Base network. No wallets. No passwords. Just Face ID.

[![npm version](https://img.shields.io/npm/v/@rockfridrich/villa-sdk.svg)](https://www.npmjs.com/package/@rockfridrich/villa-sdk)
[![npm downloads](https://img.shields.io/npm/dm/@rockfridrich/villa-sdk.svg)](https://www.npmjs.com/package/@rockfridrich/villa-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## Security & Trust

| Guarantee | Implementation |
|-----------|----------------|
| **Passkeys never leave device** | WebAuthn hardware-bound keys |
| **Zero knowledge** | Villa never sees your private key |
| **Trustless deploys** | npm provenance attestation via OIDC |
| **Minimal dependencies** | Only `viem` + `zod` (peer deps) |
| **Origin validation** | Strict postMessage origin checks |
| **Input validation** | Zod schemas for all external data |

```
Dependencies: 2 peer (viem, zod)
Bundle size: ~22KB minified
```

## Install

```bash
npm install @rockfridrich/villa-sdk viem zod
```

## Quick Start

```tsx
import { Villa } from '@rockfridrich/villa-sdk'

const villa = new Villa({ appId: 'your-app' })
const result = await villa.signIn()

if (result.success) {
  console.log('Welcome', result.identity.nickname)
  console.log('Address:', result.identity.address)
}
```

## React Integration

```tsx
import { VillaProvider, VillaAuth, useIdentity } from '@rockfridrich/villa-sdk-react'

function App() {
  return (
    <VillaProvider config={{ appId: 'your-app' }}>
      <AuthenticatedApp />
    </VillaProvider>
  )
}

function AuthenticatedApp() {
  const identity = useIdentity()

  if (!identity) {
    return <VillaAuth onComplete={() => {}} />
  }

  return <h1>Welcome, @{identity.nickname}!</h1>
}
```

## API

### Villa Class

```ts
const villa = new Villa({
  appId: 'your-app',           // Required
  network: 'base',             // 'base' | 'base-sepolia'
})

await villa.signIn()           // Authenticate user
villa.signOut()                // Clear session
villa.isAuthenticated()        // Check auth state
villa.getIdentity()            // Get current user
```

### Types

```typescript
interface Identity {
  address: `0x${string}`
  nickname: string
  avatar: AvatarConfig
}

type SignInResult =
  | { success: true; identity: Identity }
  | { success: false; error: string; code: SignInErrorCode }

type SignInErrorCode = 'CANCELLED' | 'AUTH_FAILED' | 'NETWORK_ERROR' | 'TIMEOUT'
```

### Utilities

```ts
import {
  resolveEns,           // nickname.villa.cash → address
  reverseEns,           // address → nickname
  getAvatarUrl,         // Get avatar image URL
  getContracts,         // Contract addresses by chain
} from '@rockfridrich/villa-sdk'
```

## Network

| Network | Chain ID | Usage |
|---------|----------|-------|
| Base | 8453 | Production |
| Base Sepolia | 84532 | Testing |

## AI Integration

This package includes `CLAUDE.txt` and `llms.txt` for AI coding assistants.

**One-prompt integration:** Just tell your AI assistant:

> "Add Villa authentication to my app"

Works with Claude Code, Cursor, Windsurf, and Lovable.

## Architecture

```
Your App                        Villa
========                        =====
import { Villa }        -->     SDK Client
villa.signIn()          -->     Fullscreen iframe
                                    |
                                    v
                                WebAuthn passkey
                                    |
Promise<Identity>       <--     postMessage bridge
```

## Links

- [Documentation](https://developers.villa.cash)
- [GitHub](https://github.com/rockfridrich/villa)
- [Security Policy](https://github.com/rockfridrich/villa/security)

## License

MIT
