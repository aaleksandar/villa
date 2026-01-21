# Identity Agent

Specialized agent for Villa user identity management.

## Domain

This agent handles all identity-related concerns:

- **Nickname system** - Generation, validation, persistence, on-chain minting
- **TinyCloud integration** - User data sync across apps via passkey-governed storage
- **Profile management** - Avatar, nickname, user preferences
- **On-chain identity** - ENS-compatible nickname registration on Base

## Architecture Overview

```
User Registration Flow:
=======================

1. Passkey Creation (key.villa.cash)
   └─> Porto SDK creates smart account
   └─> Random "viby" nickname auto-generated

2. Profile Persistence (3 layers)
   ├─> TinyCloud KV (passkey-governed, cross-app sync)
   ├─> PostgreSQL (API cache, fast lookups)
   └─> On-chain (optional, user-paid minting)

3. Nickname Lifecycle
   └─> Generated: Random viby name at registration
   └─> Editable: User can change once (free, off-chain)
   └─> Mintable: User pays gas to mint on-chain (permanent)
```

## Key Files

| File                                        | Purpose                                |
| ------------------------------------------- | -------------------------------------- |
| `packages/sdk/src/tinycloud.ts`             | TinyCloud integration for profile sync |
| `packages/sdk/src/nickname-generator.ts`    | Random viby nickname generation        |
| `apps/key/src/app/auth/page.tsx`            | Passkey registration UI                |
| `apps/hub/src/lib/db/schema.ts`             | PostgreSQL profile schema              |
| `apps/api/src/db/schema.ts`                 | API database schema (Drizzle)          |
| `contracts/src/VillaNicknameResolverV2.sol` | On-chain ENS resolver                  |

## TinyCloud Integration

TinyCloud is passkey-governed cloud storage for user data. Key concepts:

- **Space**: User's data container, identified by `{address}-{chainId}-{prefix}`
- **KV Storage**: Key-value store for user profiles
- **Delegations**: Share data access with fine-grained permissions
- **Prefix**: `villa` - isolates Villa data from other apps

### Storage Schema

```typescript
// TinyCloud KV keys for Villa
const TINYCLOUD_KEYS = {
  profile: "villa/profile", // { nickname, avatar, createdAt }
  preferences: "villa/prefs", // { theme, notifications }
  onchain: "villa/onchain", // { mintedNickname, txHash, mintedAt }
};
```

### SDK Usage

```typescript
import { TinyCloudWeb } from "@tinycloudlabs/web-sdk";

const tc = new TinyCloudWeb({
  host: "https://node.tinycloud.xyz",
  prefix: "villa",
  autoCreateSpace: true,
});

// Sign in (uses existing wallet session)
await tc.signIn();

// Store profile
await tc.storage.put("villa/profile", {
  nickname: "cosmic-fox",
  avatar: { style: "lorelei", seed: "0x..." },
  createdAt: new Date().toISOString(),
});

// Retrieve profile
const profile = await tc.storage.get("villa/profile");
```

## Nickname Generator

Random "viby" nicknames follow the pattern: `{adjective}-{noun}`

### Word Lists (curated for vibe)

**Adjectives** (positive, energetic):

- cosmic, mystic, stellar, neon, golden
- swift, bold, zen, wild, chill
- lucid, vivid, radiant, serene, epic

**Nouns** (animals, nature, abstract):

- fox, owl, wolf, phoenix, raven
- wave, storm, flame, frost, aurora
- pixel, cipher, spark, echo, drift

### Examples

- `cosmic-fox`, `zen-wave`, `neon-phoenix`
- `stellar-drift`, `mystic-owl`, `bold-spark`

## Database Schema

### PostgreSQL (apps/hub, apps/api)

```sql
CREATE TABLE profiles (
  address VARCHAR(42) PRIMARY KEY,
  nickname VARCHAR(32) UNIQUE,
  nickname_normalized VARCHAR(32) UNIQUE,
  avatar_style VARCHAR(20),
  avatar_seed VARCHAR(64),
  tinycloud_synced BOOLEAN DEFAULT false,
  onchain_minted BOOLEAN DEFAULT false,
  mint_tx_hash VARCHAR(66),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Data Flow

```
Registration:
1. User creates passkey → Porto returns address
2. Generate random nickname → "cosmic-fox"
3. Save to TinyCloud → tc.storage.put('villa/profile', {...})
4. Save to PostgreSQL → INSERT INTO profiles (...)
5. Return to SDK → { address, nickname, avatar }

Nickname Minting (optional):
1. User tops up wallet with ETH
2. Call mint API → /api/nickname/mint
3. Contract mints nickname on-chain
4. Update PostgreSQL → onchain_minted = true
5. Update TinyCloud → tc.storage.put('villa/onchain', {...})
```

## Smart Contract (V3 Upgrade Plan)

Current: `VillaNicknameResolverV2` - UUPS + Ownable2Step

Proposed V3 additions:

- `AccessControlUpgradeable` for role-based permissions
- `MINTER_ROLE` - can mint nicknames for users
- `UPGRADER_ROLE` - can upgrade contract
- On-chain nickname storage (not just CCIP-Read)

```solidity
// V3 additions
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

mapping(address => string) public nicknames;
mapping(string => address) public reverseNicknames;

function mintNickname(address user, string calldata nickname)
    external
    onlyRole(MINTER_ROLE)
{
    require(bytes(nicknames[user]).length == 0, "Already minted");
    require(reverseNicknames[nickname] == address(0), "Nickname taken");

    nicknames[user] = nickname;
    reverseNicknames[nickname] = user;

    emit NicknameMinted(user, nickname);
}
```

## API Endpoints

### Profile Endpoints

| Endpoint                | Method | Description           |
| ----------------------- | ------ | --------------------- |
| `/api/profile/:address` | GET    | Get user profile      |
| `/api/profile`          | POST   | Create/update profile |
| `/api/profile/sync`     | POST   | Sync with TinyCloud   |

### Nickname Endpoints

| Endpoint                    | Method | Description                |
| --------------------------- | ------ | -------------------------- |
| `/api/nickname/generate`    | GET    | Generate random nickname   |
| `/api/nickname/check/:name` | GET    | Check availability         |
| `/api/nickname/claim`       | POST   | Claim nickname (off-chain) |
| `/api/nickname/mint`        | POST   | Mint nickname on-chain     |

## Validation Rules

### Nickname Constraints

```typescript
const NICKNAME_RULES = {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-z][a-z0-9-]*[a-z0-9]$/, // lowercase, alphanumeric + hyphens
  reserved: ["admin", "villa", "system", "api", "www"],
  cooldown: 30 * 24 * 60 * 60 * 1000, // 30 days between changes
  maxChanges: 1, // Only 1 free change allowed
};
```

## Error Codes

| Code                    | Description                     |
| ----------------------- | ------------------------------- |
| `NICKNAME_TAKEN`        | Nickname already claimed        |
| `NICKNAME_INVALID`      | Doesn't match pattern           |
| `NICKNAME_RESERVED`     | Reserved word                   |
| `CHANGE_LIMIT_REACHED`  | Max nickname changes exceeded   |
| `COOLDOWN_ACTIVE`       | Must wait before changing again |
| `INSUFFICIENT_BALANCE`  | Need ETH for on-chain minting   |
| `TINYCLOUD_SYNC_FAILED` | TinyCloud storage error         |

## Testing

```bash
# Run identity-related tests
bun test --filter="nickname|profile|identity"

# E2E tests for registration flow
bun run --cwd apps/hub test:e2e --grep="registration"
```

## Commands for Agent

When delegating identity tasks to this agent, include:

```
TASK: [specific identity task]
CONTEXT:
- User address: [if applicable]
- Current nickname: [if applicable]
- TinyCloud status: [synced/not synced]
EXPECTED: [what should happen]
```
