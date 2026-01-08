# Passkey Authentication - Current Issues & Roadmap

**Last Updated:** 2026-01-09
**Owner:** Rocky + Claude
**Status:** Active (stabilization sprint)

---

## Current State

### Production Implementation
- **Mode:** Porto Dialog Mode (`Mode.dialog()`) on main domains
- **RP ID:** `id.porto.sh` (Porto owns passkeys in dialog mode)
- **Ecosystem:** 1Password, iCloud Keychain, Windows Hello work in dialog mode
- **Theming:** Villa colors + logo in Porto dialog

### What Works
- [x] First-time passkey creation (dialog mode)
- [x] Returning user authentication
- [x] 1Password passkey manager integration (dialog mode only)
- [x] E2E tests passing

### What Doesn't Work
- [ ] Custom RP ID (key.villa.cash) - `keystoreHost` only works in relay mode
- [ ] 1Password in relay mode - browser extension can't intercept direct WebAuthn calls
- [ ] Full UI customization - Porto limits to theming in dialog mode

---

## Known Issues

### Issue 1: Dialog Mode vs Relay Mode Trade-off

**The Problem:**
- **Dialog Mode:** 1Password works, but passkeys show "Porto" not "Villa"
- **Relay Mode + keystoreHost:** Custom domain (villa.cash), but 1Password doesn't work

**Current Solution:** Dialog mode in production (1Password support prioritized)

**Phase 2 Options:**
1. **Self-host Porto Dialog on key.villa.cash** - Full control + 1Password
2. **Fork Porto contracts** - Deploy own Account contracts, own WebAuthn implementation
3. **Accept Porto branding** - Keep dialog mode, users see "Porto" in passkey picker

### Issue 2: SDK iframe Architecture (key.villa.cash)

**Implemented but Limited:**
- SDK points to key.villa.cash for auth
- Auth page uses dialog mode on key.villa.cash
- **BUT:** `keystoreHost` not supported in dialog mode, so passkeys still on Porto's domain

**Files Changed (commit 2da45d3):**
- `packages/sdk/src/iframe/bridge.ts` - AUTH_URLS point to key.villa.cash
- `apps/web/src/app/auth/page.tsx` - Conditional dialog/relay mode
- `apps/web/src/lib/porto.ts` - getPortoIframe(), createAccountDialog(), signInDialog()
- `.do/app-staging.yaml` / `.do/app-production.yaml` - key subdomain routes

---

## Decisions Needed

### Decision 1: Porto vs Custom Implementation

**Context:** Porto SDK doesn't support `keystoreHost` in dialog mode.

**Options:**
| Option | 1Password | Custom Domain | Effort | Risk |
|--------|-----------|---------------|--------|------|
| A) Keep Porto dialog | Yes | No (Porto) | Low | Low |
| B) Fork Porto contracts | Requires work | Yes | High | High |
| C) Self-host Porto | Yes | Yes | Medium | Medium |

**Recommendation:** A for now, investigate C for Phase 2

### Decision 2: Remove Relay Mode Code?

**Context:** Relay mode code exists but bypasses 1Password.

**Options:**
- A) Delete (YAGNI)
- B) Keep with documentation for Phase 2
- C) Move to experimental/

**Recommendation:** B - keep for Phase 2 custom RP ID work

---

## Phase 2: Custom Passkey Domain

### Vision
Users see "Villa" in passkey picker instead of "Porto"

### Approach: Self-Host Porto Dialog
1. Deploy Porto dialog on key.villa.cash
2. Configure `keystoreHost` to key.villa.cash
3. Users get Villa branding + 1Password support

### Blockers
- [ ] Understand Porto dialog hosting requirements
- [ ] Security audit for self-hosted WebAuthn
- [ ] Migration plan for existing Porto passkeys
- [ ] DNS setup for key.villa.cash

---

## Testing Limitations

E2E tests don't catch:
- 1Password integration (headless Chromium doesn't have browser extension)
- Real biometric authentication
- Porto dialog rendering issues

**Manual testing required before ANY passkey changes:**
1. Test on macOS with 1Password installed
2. Verify 1Password can intercept passkey prompt
3. Test on iOS Safari

---

## Cost Analysis (Jan 1-8, 2026)

**Total:** $970.63 (91% Opus - needs delegation to agents)

| Date | Total | Notes |
|------|-------|-------|
| Jan 4 | $336 | Peak - contracts work |
| Jan 3-7 | $130-160/day | Auth mode confusion |
| Jan 8 | $67 | Sprint planning |

**Target:** <$50/day with proper agent delegation

---

## Next Steps

1. **DNS Setup:** Add key.villa.cash and beta-key.villa.cash to CloudFlare
2. **Test Beta:** Verify dialog mode works on beta.villa.cash after deploy
3. **Phase 2 Investigation:** Research Porto self-hosting options
4. **Cost Optimization:** Delegate implementation to @build (sonnet)

---

## Related Files

- `apps/web/src/lib/porto.ts` - Porto configuration
- `apps/web/src/app/auth/page.tsx` - Auth page (dialog/relay switch)
- `packages/sdk/src/iframe/bridge.ts` - SDK auth URLs
- `.claude/LEARNINGS.md` - Pattern #50 (Porto Mode Selection)
