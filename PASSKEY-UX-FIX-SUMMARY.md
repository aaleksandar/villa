# Passkey Creation UX Issue - Fix Summary

**Date:** 2026-01-08
**Agent:** @design
**Priority:** CRITICAL - Blocks main user flow

---

## Problem Diagnosed

### Issue 1: Wrong Porto Mode in Onboarding

**Current State:**
- `apps/web/src/app/onboarding/page.tsx` uses `VillaAuthScreen` (Porto relay mode)
- Relay mode calls `navigator.credentials.create()` directly
- 1Password and passkey managers **cannot intercept** these direct WebAuthn calls
- Only native biometric (Face ID, Touch ID, Windows Hello) works

**Evidence:**
```typescript
// apps/web/src/lib/porto.ts:221-253
Mode.relay({
  webAuthn: {
    createFn: async (options) => {
      // 1Password doesn't see this!
      return await navigator.credentials.create(options)
    }
  }
})
```

**User Impact:**
- Users with 1Password installed expect it to trigger
- Instead, only device biometric prompt appears
- Confusing UX for 1Password users
- Pattern 50 in LEARNINGS.md documents this as known issue

### Issue 2: Missing Provider Indication

**Current State:**
- VillaAuthScreen shows provider logos BUT uses relay mode
- Logos are misleading - not all providers work in relay mode
- No clear indication of which passkey manager will be used
- Missing educational messaging about device biometric fallback

**Partial Fix Applied:**
- Updated VillaAuthScreen to show 1Password as "grayed out" with asterisk
- Added note: "* For 1Password support, use the main onboarding flow"
- Changed heading from "Passkey providers supported" to "Works with your device biometric"
- Added proper icons (Key for iCloud, Chrome for browser)

---

## Architecture Analysis

### Porto Mode Comparison

| Feature | Dialog Mode | Relay Mode |
|---------|-------------|------------|
| **1Password Support** | ✅ Yes | ❌ No |
| **Passkey Manager Support** | ✅ All | ❌ Limited |
| **Custom UI** | ⚠️ Theme only | ✅ Full control |
| **Use Case** | Main onboarding | SDK iframe, in-app browsers |
| **File** | VillaAuth.tsx | VillaAuthScreen.tsx |

### Component Usage Matrix

| Scenario | Component | Porto Mode | Status |
|----------|-----------|------------|--------|
| Main web onboarding | VillaAuth | Dialog (inline) | ❌ Not in use |
| Current onboarding | VillaAuthScreen | Relay | ✅ In use (WRONG) |
| SDK iframe | VillaAuthScreen | Relay | ✅ Correct |
| In-app browser | VillaAuthScreen | Relay | ✅ Correct |

---

## Recommended Fix (3-Phase)

### Phase 1: Fix Main Flow (CRITICAL)

**Goal:** Restore 1Password support for main onboarding

**Changes:**
1. Update `apps/web/src/app/onboarding/page.tsx`:
   - Change import from `VillaAuthScreen` to `VillaAuth`
   - Pass `onComplete` callback instead of `onSuccess`
   - Handle full auth flow (passkey + nickname + avatar) in VillaAuth

2. Keep `VillaAuthScreen` for SDK iframe scenarios:
   - Document clearly in component comments
   - Add warning about ecosystem limitations

**Files to change:**
```
apps/web/src/app/onboarding/page.tsx   (switch to VillaAuth)
apps/web/src/components/sdk/VillaAuth.tsx   (already uses dialog mode ✓)
```

**Verification:**
- Manual test with 1Password installed
- Verify biometric prompt shows "villa.cash" domain
- Verify 1Password triggers successfully
- E2E tests should still pass

### Phase 2: Provider Education (UX POLISH)

**Goal:** Clear user expectations about passkey providers

**Changes to VillaAuthScreen (for SDK iframe use):**
- ✅ DONE: Grayed out 1Password with asterisk
- ✅ DONE: Changed heading to "Works with your device biometric"
- ✅ DONE: Added proper icons (Key, Chrome)
- ✅ DONE: Added disclaimer about 1Password

**Additional enhancements:**
- Add tooltip to each provider explaining compatibility
- Show "active provider" during passkey ceremony in PasskeyPrompt
- Add animation to indicate which provider is being used

### Phase 3: Smart Routing (FUTURE)

**Goal:** Automatically route to optimal mode

**Implementation:**
```typescript
// Detect passkey manager availability
const hasPasskeyManager = await detectPasskeyManager()

// Route based on environment
if (isInAppBrowser()) {
  return <VillaAuthScreen /> // Relay mode
} else if (hasPasskeyManager) {
  return <VillaAuth /> // Dialog mode for ecosystem
} else {
  return <VillaAuth /> // Dialog mode with biometric
}
```

---

## Design Specifications

### Updated Provider Grid (VillaAuthScreen)

**Current implementation (after fix):**

```typescript
<p className="text-xs text-center text-ink-muted mb-3">
  Works with your device biometric
</p>
<div className="grid grid-cols-3 gap-3">
  {/* Row 1: Native Platform Support */}
  <ProviderCard icon={<Key />} label="iCloud" gradient="gray-700 to gray-900" />
  <ProviderCard icon="G" label="Google" gradient="blue-600 to green-600" />
  <ProviderCard icon="W" label="Windows" gradient="blue-500 to cyan-400" />

  {/* Row 2: Browser & Hardware */}
  <ProviderCard icon={<Chrome />} label="Browser" gradient="orange-500 to red-500" />
  <ProviderCard icon={<ShieldCheck />} label="FIDO2" gradient="green-600 to blue-600" />
  <ProviderCard icon="1P" label="1Password*" gradient="blue-500 to blue-600" disabled />
</div>
<p className="text-xs text-center text-ink-muted mt-2 opacity-75">
  * For 1Password support, use the main onboarding flow
</p>
```

**Design tokens used:**
- Spacing: `gap-3` (12px), `p-3` (12px padding)
- Border radius: `rounded-lg` (8px)
- Colors: Villa design tokens (no hardcoded hex)
- Touch targets: 44x44px minimum (cards are larger)

### VillaAuth Provider Indication (Future)

**During passkey ceremony:**
```
┌─────────────────────────────────┐
│  Creating your Villa ID         │
│                                 │
│  [1Password Logo - Pulsing]    │
│                                 │
│  Using 1Password                │
│  Waiting for biometric...       │
└─────────────────────────────────┘
```

---

## Testing Checklist

### Manual Testing (REQUIRED)

Before shipping ANY changes to passkey flow:

```bash
□ Test on macOS with 1Password installed
  → Verify 1Password prompt appears
  → Verify passkey saves to 1Password vault

□ Test on iOS with iCloud Keychain
  → Verify Face ID/Touch ID prompt
  → Verify passkey saves to iCloud

□ Test on Android with Google Password Manager
  → Verify fingerprint prompt
  → Verify passkey saves to Google

□ Test on Windows with Windows Hello
  → Verify biometric prompt
  → Verify passkey saves to Windows

□ Test in-app browser (Instagram, Twitter)
  → Should use VillaAuthScreen (relay mode)
  → Should show device biometric

□ E2E tests still pass
  → npm run test:e2e
```

### E2E Limitations

**Important:** E2E tests CANNOT validate passkey manager integration because:
- Headless browser doesn't support real biometric
- Tests call WebAuthn directly (like relay mode)
- 1Password hooks only work in real browser with extension

**Therefore:** Manual testing is REQUIRED for passkey changes.

---

## Architecture Decision Record (ADR)

### Decision: Use Dialog Mode for Main Onboarding

**Context:**
- VillaAuthScreen (relay mode) was implemented for custom UI control
- Pattern 50 documents that relay mode breaks 1Password integration
- User reported: "flow doesn't trigger 1password"
- E2E tests passed but real ecosystem was broken

**Decision:**
Use Porto dialog mode (via VillaAuth component) for main web onboarding flow.

**Rationale:**
1. **Ecosystem support > UI customization** for passkeys
2. 1Password is critical for security-conscious users
3. Porto theme API provides sufficient customization
4. Relay mode should be reserved for scenarios where dialog won't render (SDK iframe, in-app browsers)

**Consequences:**
- ✅ 1Password and all passkey managers work
- ✅ Users see familiar passkey ecosystem UX
- ⚠️ Less UI control (theme-only customization)
- ⚠️ Porto iframe shows instead of full custom UI
- ✅ Clear separation: Dialog for web, Relay for SDK

**Alternatives Considered:**
1. Keep relay mode, show 1Password logo anyway → REJECTED (misleading)
2. Detect 1Password, route to dialog mode → DEFERRED to Phase 3
3. Fork Porto SDK to intercept relay mode → REJECTED (maintenance burden)

---

## Implementation Plan

### Immediate Actions (Today)

1. ✅ **DONE:** Update VillaAuthScreen provider grid
   - Gray out 1Password
   - Add disclaimer about main flow
   - Change heading to device biometric
   - Add proper icons

2. **TODO:** Switch onboarding to VillaAuth
   ```bash
   @build "Update onboarding page to use VillaAuth component"
   ```

3. **TODO:** Manual testing
   ```bash
   # Test with 1Password
   open https://localhost:3000/onboarding
   ```

### Follow-up (This Week)

1. Add provider detection to PasskeyPrompt
2. Show active provider during ceremony
3. Add tooltips explaining provider compatibility
4. Document Porto mode selection in ADR

### Future (Phase 3)

1. Implement smart routing based on environment
2. A/B test dialog vs relay for users without passkey managers
3. Collect metrics on passkey provider usage

---

## Files Changed

### Modified:
- ✅ `apps/web/src/components/sdk/VillaAuthScreen.tsx`
  - Updated provider grid
  - Added device biometric messaging
  - Grayed out 1Password with disclaimer
  - Added Key and Chrome icons

### To be modified:
- `apps/web/src/app/onboarding/page.tsx`
  - Switch from VillaAuthScreen to VillaAuth
  - Update to use onComplete callback
  - Remove custom handleAuthSuccess logic

---

## References

- **LEARNINGS.md Pattern 50:** Porto Mode Selection Pattern (lines 490-571)
- **Design Principles:** `/specs/reference/design-principles.md`
- **Porto SDK Docs:** https://porto.sh/sdk
- **VillaAuth Component:** `apps/web/src/components/sdk/VillaAuth.tsx`
- **VillaAuthScreen Component:** `apps/web/src/components/sdk/VillaAuthScreen.tsx`
- **Porto Configuration:** `apps/web/src/lib/porto.ts`

---

## Summary

**Root cause:** Onboarding uses relay mode (direct WebAuthn calls) instead of dialog mode (Porto iframe with ecosystem hooks).

**Fix:** Switch to VillaAuth component which uses Porto dialog mode with inline rendering.

**Status:**
- VillaAuthScreen provider UI: ✅ Fixed
- Onboarding flow migration: ⏳ Ready for implementation
- Manual testing: ⏳ Pending after migration

**Impact:** Restores 1Password and all passkey manager integrations for main onboarding flow.

---

**Next Steps:**

```bash
# 1. Implement onboarding migration
@build "Switch onboarding page from VillaAuthScreen to VillaAuth"

# 2. Manual test
"Test with 1Password to verify passkey manager integration"

# 3. Ship
git add . && git commit -m "fix(auth): restore 1Password support via dialog mode"
```
