# Villa Production Roadmap

**Updated:** 2026-01-06
**Status:** SINGLE SOURCE OF TRUTH
**Current:** Beta (Base Sepolia) - PRODUCTION READY

---

## Executive Summary

Villa beta is **production ready**. All core features work. Mainnet deployment is blocked by external dependencies only.

### Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Auth Flow | ✅ Complete | Sign in, create account, returning user |
| Passkeys | ✅ Working | Via Porto SDK (`id.porto.sh`) |
| Nicknames | ✅ Persist | Database-backed, cross-device |
| Avatars | ✅ Persist | Database-backed, cross-device |
| SDK | ✅ Published | `@rockfridrich/villa-sdk` on npm |
| Contracts | ✅ Deployed | Base Sepolia, UUPS upgradeable |
| Developer Portal | ✅ Live | developers.villa.cash |
| E2E Tests | ✅ Passing | 143/171 (28 skipped = DB-dependent) |

### Deferred (Not Blocking Beta)

| Item | Why Deferred |
|------|--------------|
| TinyCloud | Only needed for custom avatar uploads (generated avatars persist via DB) |
| Full CCIP-Read | Direct API works (`/ens/addr/:name`), EIP-3668 can wait |
| Custom Passkey RP | Phase 2 - requires security audit + user migration |

### Blocked (External Dependencies)

| Item | Blocker |
|------|---------|
| Mainnet Deploy | Security audit + Groth16 verifier + Multisig |

---

## What's Complete

### Core Identity System
- [x] Porto SDK integration (passkey auth)
- [x] Nickname selection with availability check
- [x] Avatar generation (DiceBear + randomize)
- [x] Profile persistence (PostgreSQL)
- [x] Cross-device sync (database-backed)
- [x] Returning user flow
- [x] Session management

### SDK & Developer Experience
- [x] `@rockfridrich/villa-sdk` npm package
- [x] Iframe bridge with postMessage
- [x] Popup fallback mode
- [x] Origin allowlisting security
- [x] Developer portal (developers.villa.cash)

### Infrastructure
- [x] VillaNicknameResolverV2 contract (Sepolia)
- [x] BiometricRecoverySignerV2 contract (Sepolia)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Preview deploys (dev-1, dev-2)
- [x] Staging deploy (beta.villa.cash)
- [x] Production deploy (villa.cash)

### Specs Complete (16 in done/)
- auth-flow, avatar-selection, avatar-system, developers-portal
- identity-sdk, identity-system (product + wbs), near-terminal-integration
- nickname, profile-settings-component, returning-user-flow
- sdk-mlp-roadmap, v1-passkey-login, v2-architecture (+ wbs)
- agent-optimization

---

## Mainnet Path

### Prerequisites (All External)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAINNET BLOCKERS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Security Audit]     [Groth16 Verifier]     [Multisig]        │
│       EXTERNAL             EXTERNAL            MANUAL           │
│                                                                 │
│  Trail of Bits,       Bionetta/Rarimo       Safe 2/3 or 3/5   │
│  OpenZeppelin,        integration for       for contract       │
│  Spearbit             biometric proofs      ownership          │
│                                                                 │
│         └──────────────► MAINNET DEPLOY ◄───────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Deploy Checklist (When Ready)

```
Pre-Deploy:
[ ] Security audit complete (no critical findings)
[ ] Groth16Verifier deployed and tested
[ ] Multisig created (Safe)
[ ] Contract tests passing (121 tests)
[ ] Beta stable 2+ weeks

Deploy:
[ ] Deploy VillaNicknameResolverV2 proxy
[ ] Deploy BiometricRecoverySignerV2 proxy
[ ] Verify on Basescan
[ ] Set gateway URL to production API
[ ] Transfer ownership to multisig

Post-Deploy:
[ ] Smoke tests pass
[ ] Monitor 24 hours
[ ] Enable mainnet in app
```

---

## Future Enhancements (Post-Mainnet)

### Phase 2: Passkey Sovereignty
- Research Porto custom RP ID support
- Option: `key.villa.cash` as RP ID
- Requires: Security audit + user migration plan
- See: `specs/reference/passkey-domain-ownership.md`

### Phase 3: Extended Features
- TinyCloud for custom avatar uploads
- Full CCIP-Read (EIP-3668) for external resolvers
- React hooks package (`@villa/react`)
- Credential aggregation
- See: `specs/reference/sdk-external-roadmap.md`

### Phase 4: Multi-Chain
- Solana support (when passkey wallets mature)
- Chain-agnostic identity resolution
- See: `specs/reference/vision.md`

---

## Contract Addresses

### Base Sepolia (Testnet)
```
VillaNicknameResolverV2: 0xf4648423aC6b3f6328018c49B2102f4E9bA6D800
BiometricRecoverySignerV2: 0x... (see contracts/deployments/)
MockVerifier: 0x3a4C091500159901deB27D8F5559ACD8a643A12b
```

### Base Mainnet
```
Not deployed - blocked by security audit
```

---

## Links

- [Reference Specs](../reference/) - Deferred/future work
- [Done Specs](../done/) - Completed features
- [LEARNINGS.md](../../.claude/LEARNINGS.md) - Patterns that worked
- [Porto SDK](https://porto.sh/sdk)
