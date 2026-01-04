# @villa/sdk

Privacy-first passkey authentication SDK for pop-up villages on Base.

## Installation

```bash
npm install @villa/sdk
# or
pnpm add @villa/sdk
```

## Quick Start

```typescript
import { Villa } from '@villa/sdk'

// Initialize SDK
const villa = new Villa({
  appId: 'your-app-id',
  network: 'base-sepolia', // or 'base' for mainnet
})

// Sign in user
const result = await villa.signIn({
  scopes: ['profile', 'wallet'],
  onProgress: (step) => console.log(step.message),
})

if (result.success) {
  console.log('Welcome,', result.identity.nickname)
  console.log('Address:', result.identity.walletAddress)
  console.log('Avatar:', result.identity.avatar)
}
```

## API Reference

### Villa Class

```typescript
class Villa {
  constructor(config: VillaConfig)

  // Authentication
  signIn(options?: SignInOptions): Promise<SignInResult>
  signOut(): Promise<void>
  isAuthenticated(): boolean
  getIdentity(): Identity | null

  // ENS
  resolveEns(name: string): Promise<string | null>
  reverseEns(address: string): Promise<string | null>

  // Avatar
  getAvatarUrl(seed: string, config?: AvatarConfig): string

  // Config
  getNetwork(): 'base' | 'base-sepolia'
  getApiUrl(): string
  getConfig(): VillaConfig
}
```

### Types

```typescript
interface VillaConfig {
  appId: string               // Your registered app ID
  network?: 'base' | 'base-sepolia'  // Network (default: 'base')
  apiUrl?: string             // API URL (default: 'https://api.villa.cash')
}

interface SignInOptions {
  scopes?: Scope[]            // Data to request (default: ['profile'])
  onProgress?: (step) => void // Progress callback
  timeout?: number            // Timeout in ms (default: 5 min)
}

type Scope = 'profile' | 'wallet'

interface Identity {
  walletAddress: string       // User's wallet address
  nickname: string            // User's nickname (e.g., 'alice')
  avatar: string              // Avatar URL
}

type SignInResult =
  | { success: true; identity: Identity }
  | { success: false; error: string; code: SignInErrorCode }

type SignInErrorCode =
  | 'CANCELLED'     // User closed auth flow
  | 'TIMEOUT'       // Auth timed out
  | 'NETWORK_ERROR' // Failed to load auth page
  | 'INVALID_CONFIG' // Invalid SDK config
  | 'AUTH_ERROR'    // General auth error
```

## Architecture

```
External App                     Villa
============                     =====
import { Villa }         -->     packages/sdk/client.ts
  |
villa.signIn()           -->     packages/sdk/iframe.ts
  |                              |
  |                              v
  |                              Fullscreen iframe (villa.cash/auth)
  |                              |
  v                              v
Promise<SignInResult>    <--     postMessage bridge
```

### How Sign-In Works

1. **SDK creates fullscreen iframe** pointing to `villa.cash/auth`
2. **User authenticates** via passkey (Face ID, Touch ID, fingerprint)
3. **Porto SDK handles WebAuthn** in the iframe
4. **Identity returned via postMessage** to the SDK
5. **SDK stores session** in localStorage (7-day TTL)

### File Structure

```
packages/sdk/src/
├── index.ts       # Public exports
├── client.ts      # Villa class (main entry point)
├── iframe.ts      # Auth iframe + postMessage bridge
├── auth.ts        # Auth flow utilities
├── avatar.ts      # DiceBear avatar generation
├── ens.ts         # ENS resolution (viem)
├── session.ts     # Session persistence (localStorage)
├── wallet.ts      # Secure key management
├── contracts.ts   # Deployed contract addresses
└── types.ts       # TypeScript types
```

## Development

```bash
# Install deps
pnpm install

# Type check
pnpm --filter @villa/sdk typecheck

# Build
pnpm --filter @villa/sdk build
```

## Contract Addresses

### Base Sepolia (Testnet)

| Contract | Proxy |
|----------|-------|
| VillaNicknameResolverV2 | `0xf4648423aC6b3f6328018c49B2102f4E9bA6D800` |
| BiometricRecoverySignerV2 | `0xdFb55a363bdF549EE5C2e77D0aAaC39276ED5836` |

### Using Contract Addresses

```typescript
import { getContracts, getNicknameResolverAddress } from '@villa/sdk'

// Get all contracts for a chain
const contracts = getContracts(84532) // Base Sepolia

// Get specific address
const resolverAddress = getNicknameResolverAddress(84532)
```

## Security

- **Passkeys never leave device** - WebAuthn handles auth securely
- **Origin validation** - iframe only accepts messages from trusted origins
- **Message schema validation** - postMessage payloads validated with Zod
- **Session encryption** - Sessions stored securely in localStorage

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Key Areas

1. **React Hooks** - Create `@villa/react` with hooks
2. **Storage** - TinyCloud abstraction
3. **Credentials** - Zupass, Sola, EAS aggregation

## License

MIT
