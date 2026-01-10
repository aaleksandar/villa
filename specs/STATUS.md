# Spec Status Tracker

**Last Updated:** 2026-01-08

---

## Active Specs

### Cross-Chain Deposits via Glide
**File:** `specs/active/cross-chain-deposits.md`
**Status:** Draft (pending approval)
**Created:** 2026-01-08
**Priority:** P1 (post-mainnet enhancement)

**Summary:** Enable users to fund their Villa Base address from any chain using Glide's bridging widget. One-click deposits from Ethereum, Arbitrum, Optimism, Polygon, etc.

**Blockers:**
- Needs Glide project creation and API credentials
- Mainnet deploy should complete first (Base address must be valid)

**Next Actions:**
1. Review and approve spec
2. Create Glide project at buildwithglide.com
3. `@build "Implement cross-chain deposits"` after approval

**Design Work Needed:**
- "Add Funds" button placement on home page
- Success/error states within Villa chrome
- Mobile bottom sheet variant

---

### Sprint: Auth Stabilization & Corrections
**File:** `specs/active/sprint-corrections.md`
**Status:** Active (needs user decisions)
**Created:** 2026-01-08
**Priority:** P0 (blocks mainnet polish)

**Summary:** Stabilize auth flows after relay mode implementation. Fix mixed dialog/relay mode usage, clarify custom passkey domain roadmap.

**Blockers:**
- Needs user decisions on 4 open questions (relay mode, VillaAuthScreen, SDK demo, custom RP ID)

**Next Actions:**
1. User reviews open questions
2. Execute P0 tasks based on decisions
3. Update production roadmap with Phase 2 plan

---

### Production Roadmap
**File:** `specs/active/production-roadmap.md`
**Status:** Living document
**Last Updated:** 2026-01-06

**Summary:** Single source of truth for Villa's production status and mainnet path.

**Current Phase:** Beta (Base Sepolia) - Production Ready
**Blockers:** External only (security audit, Groth16 verifier, multisig)

---

## Reference Specs (Future Work)

- `passkey-domain-ownership.md` - Custom RP ID investigation (Phase 2)
- `sdk-external-roadmap.md` - External developer features
- `auth-ui-*.md` - Auth UI research and comparisons
- `villa-biometric-recovery-spec.md` - Face recovery system
- `ens-villa-cash.md` - ENS integration plans

---

## Done Specs (Completed Features)

See `specs/done/` directory for 16 completed feature specs:
- auth-flow, avatar-selection, avatar-system
- developers-portal, identity-sdk, identity-system
- nickname, profile-settings-component
- returning-user-flow, sdk-mlp-roadmap
- v1-passkey-login, v2-architecture
- agent-optimization

---

## Spec Lifecycle

```
idea → specs/reference/       (research, future work)
       ↓
approved → specs/active/      (current sprint)
       ↓
done → specs/done/             (archived, implemented)
```

---

## Quick Commands

```bash
# View active specs
ls -lh specs/active/

# View reference specs
ls -lh specs/reference/

# Search specs
grep -r "passkey" specs/

# Create new spec
cp specs/reference/tech-spec-guide.md specs/active/my-feature.md
```
