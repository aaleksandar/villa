# Villa Identity SDK

[![CI](https://github.com/rockfridrich/villa/actions/workflows/ci.yml/badge.svg)](https://github.com/rockfridrich/villa/actions/workflows/ci.yml)
[![Deploy](https://github.com/rockfridrich/villa/actions/workflows/deploy.yml/badge.svg)](https://github.com/rockfridrich/villa/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Privacy-first passkey authentication for pop-up villages on Base.**

Drop-in identity SDK: passkey auth, persistent nicknames, and avatars in under 10 lines of code.

## SDK Quick Start

```bash
npm install @villa/sdk
```

```typescript
import { Villa } from '@villa/sdk'

const villa = new Villa({
  appId: 'your-app-id',
  appSignature: '0x...',
  appWallet: '0x...'
})

// Open fullscreen passkey auth
const result = await villa.signIn()

if (result.success) {
  console.log(result.identity.nickname)    // "alice"
  console.log(result.identity.walletAddress) // "0x..."
  console.log(result.identity.avatar)       // DiceBear avatar URL
}
```

**What you get:**
- Passwordless auth via Face ID / Touch ID / fingerprint
- Persistent nickname (alice.villa.eth)
- Deterministic avatar generation
- Session management (7-day TTL)

## Live Environments

| Environment | URL | Status |
|-------------|-----|--------|
| Production | [villa.cash](https://villa.cash) | Stable |
| Staging | [beta.villa.cash](https://beta.villa.cash) | Latest main |
| Preview | dev-1/dev-2.villa.cash | PR previews |

## Project Structure

```
villa/
├── packages/
│   ├── sdk/           # @villa/sdk - The main product
│   │   ├── client.ts  # Villa class (signIn, signOut)
│   │   ├── iframe.ts  # Auth iframe + postMessage bridge
│   │   ├── auth.ts    # Authentication flow
│   │   ├── avatar.ts  # DiceBear avatar generation
│   │   ├── ens.ts     # ENS resolution (alice.villa.eth)
│   │   ├── session.ts # Session persistence
│   │   ├── wallet.ts  # Secure key management
│   │   └── contracts.ts # Deployed contract addresses
│   └── ui/            # @villa/ui - Design system
├── apps/
│   ├── web/           # @villa/web - villa.cash frontend
│   │   ├── app/       # Next.js pages
│   │   │   ├── developers/  # Developer portal
│   │   │   └── onboarding/  # User onboarding
│   │   └── components/
│   │       └── sdk/   # SDK auth screens
│   └── api/           # @villa/api - Hono API
├── contracts/         # @villa/contracts - Solidity
│   ├── VillaNicknameResolverV2
│   └── BiometricRecoverySignerV2
└── specs/             # Feature specifications
    ├── active/        # Current sprint
    └── done/          # Completed specs
```

## Development

```bash
# Install dependencies
pnpm install

# Local development
pnpm dev              # http://localhost:3000

# Passkey testing (requires mkcert)
pnpm dev:https        # https://localhost:3000

# Run before every push
pnpm verify           # typecheck + lint + build + E2E tests
```

### Testing

```bash
pnpm test:e2e:chromium                    # All E2E tests
BASE_URL=https://beta.villa.cash pnpm test:e2e:chromium  # Against staging
```

## Contract Addresses (Base Sepolia)

| Contract | Proxy | Implementation |
|----------|-------|----------------|
| VillaNicknameResolverV2 | `0xf4648423aC6b3f6328018c49B2102f4E9bA6D800` | `0xd959290E5E5f99D1e56765aFcd1c786E9118AAe7` |
| BiometricRecoverySignerV2 | `0xdFb55a363bdF549EE5C2e77D0aAaC39276ED5836` | `0xbff139E1db248B60B0BEAA7864Ba180597714D7F` |

## Contributing

We need help with:

1. **SDK (@villa/sdk)** - Core product
   - React hooks package (`@villa/react`)
   - Storage abstraction (TinyCloud)
   - Credential aggregation (Zupass, Sola, EAS)

2. **Developer Portal**
   - App registration flow
   - Documentation site
   - OpenAPI spec

3. **Infrastructure**
   - CCIP-Read gateway for ENS
   - Production mainnet deployment

### Getting Started

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/villa.git
cd villa

# Install dependencies
pnpm install

# Run locally
pnpm dev

# Make changes, then verify
pnpm verify

# Commit with conventional commits
git commit -m "feat(sdk): add credential aggregation"
```

### Commit Convention

```
feat(scope): add feature
fix(scope): fix bug
docs(scope): update docs
test(scope): add tests
refactor(scope): refactor code
```

Scopes: `sdk`, `web`, `api`, `contracts`, `ui`

### Pull Request Process

1. Create branch from `main`
2. Make changes
3. Run `pnpm verify`
4. Create PR with clear description
5. Wait for CI + review

## Roadmap

| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 1 | SDK auth screens, API infra, contracts | Done |
| Sprint 2 | Iframe integration, developer portal | In Progress |
| Sprint 3 | React package, storage, docs | Next |

See [specs/active/sdk-mlp-roadmap.md](specs/active/sdk-mlp-roadmap.md) for details.

## Architecture

```
User App                      Villa
=========                     =====
import { Villa }      -->     packages/sdk/
villa.signIn()        -->     Fullscreen iframe
  |                           |
  v                           v
Passkey prompt        <--     apps/web/sdk/* screens
  |                           |
  v                           v
Identity returned     <--     Porto SDK + contracts
```

**Privacy model:**
- Passkeys never leave device (WebAuthn)
- User controls data sharing
- Apps only get what user consents to

## Links

- [SDK Docs](https://villa.cash/developers/docs) - Quick start
- [Developer Portal](https://villa.cash/developers) - Register apps
- [Telegram](https://t.me/proofofretreat) - Community chat
- [Porto SDK](https://porto.sh/sdk) - Underlying passkey auth

## Security

- Passkeys stay in device secure enclave
- No passwords stored anywhere
- Biometrics processed 100% on-device
- Contract upgrades via UUPS proxy pattern

Report vulnerabilities: security@villa.cash

## License

MIT
