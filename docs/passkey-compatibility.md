# Passkey Compatibility Matrix

Complete reference for passkey support across platforms, browsers, and password managers in Villa.

## Porto Mode Architecture

Villa uses Porto SDK with three operational modes:

### Mode Comparison

| Mode | 1Password | Custom Domain | Custom UI | Use Case |
|------|-----------|---------------|-----------|----------|
| Dialog (Porto-hosted) | ✅ | ❌ | Theme only | Quick integration |
| Dialog (Self-hosted) | ✅ | ✅ | Full | **Recommended** |
| Relay | ❌ | ✅ | Full | Nested iframes only |

### Self-Hosted Dialog Architecture

```
villa.cash (parent page)
  └─ Mode.dialog({ host: 'https://key.villa.cash/auth' })
     └─ iframe: key.villa.cash/auth
        └─ Mode.rpcServer({ keystoreHost: 'key.villa.cash' })
           └─ navigator.credentials.create/get
              └─ 1Password intercepts HERE ✅
```

**Why it works:**
1. 1Password content scripts inject into ALL frames (including iframes)
2. Iframe provides fresh user gesture for WebAuthn
3. Porto's postMessage protocol handles parent-iframe communication
4. `Mode.rpcServer` exposes WebAuthn in context where password managers can intercept

---

## Browser Support

### Desktop

| Browser | macOS | Windows | Linux | Notes |
|---------|-------|---------|-------|-------|
| Chrome 108+ | ✅ | ✅ | ✅ | Full support |
| Safari 16+ | ✅ | - | - | iCloud Keychain integration |
| Edge 108+ | ❌ | ✅ | ✅ | Windows Hello on Windows |
| Firefox 119+ | ✅ | ✅ | ✅ | Experimental, enable flag |
| Brave 1.48+ | ✅ | ✅ | ✅ | Chromium-based |

### Mobile

| Browser | iOS 16+ | Android 9+ | Notes |
|---------|---------|------------|-------|
| Safari | ✅ | - | iCloud Keychain |
| Chrome | ✅ | ✅ | Google Password Manager |
| Edge | ✅ | ✅ | Syncs with desktop |
| Firefox | ⚠️ | ⚠️ | Limited support |
| In-app browsers | ⚠️ | ⚠️ | Use relay mode |

**Legend:**
- ✅ Full support
- ⚠️ Partial/experimental
- ❌ Not supported

---

## Password Manager Support

### 1Password

| Platform | Dialog Mode | Relay Mode | Self-Hosted Dialog |
|----------|-------------|------------|-------------------|
| macOS (Safari) | ✅ | ❌ | ✅ |
| macOS (Chrome) | ✅ | ❌ | ✅ |
| Windows (Chrome) | ✅ | ❌ | ✅ |
| Windows (Edge) | ✅ | ❌ | ✅ |
| iOS (Safari) | ✅ | ❌ | ✅ |
| Android (Chrome) | ✅ | ❌ | ✅ |

**Requirements:**
- 1Password browser extension installed
- 1Password desktop app running (desktop platforms)
- Biometric unlock enabled

**Interception mechanism:**
1Password injects content scripts into all iframe contexts, intercepts `navigator.credentials.*` calls before WebAuthn API.

### iCloud Keychain

| Platform | Dialog Mode | Relay Mode | Self-Hosted Dialog |
|----------|-------------|------------|-------------------|
| macOS (Safari) | ✅ | ✅ | ✅ |
| macOS (Chrome) | ⚠️ | ⚠️ | ⚠️ |
| iOS (Safari) | ✅ | ✅ | ✅ |

**Requirements:**
- Apple device with biometric (Face ID/Touch ID)
- iCloud Keychain enabled in Settings
- Safari recommended for best experience

**Note:** Chrome on macOS can access iCloud Keychain but with reduced UX.

### Google Password Manager

| Platform | Dialog Mode | Relay Mode | Self-Hosted Dialog |
|----------|-------------|------------|-------------------|
| Android (Chrome) | ✅ | ✅ | ✅ |
| Windows (Chrome) | ✅ | ✅ | ✅ |
| macOS (Chrome) | ✅ | ✅ | ✅ |

**Requirements:**
- Signed in to Chrome with Google account
- Sync enabled

### Bitwarden

| Platform | Dialog Mode | Relay Mode | Self-Hosted Dialog |
|----------|-------------|------------|-------------------|
| All platforms | ⚠️ | ❌ | ⚠️ |

**Status:** Experimental passkey support as of 2024. May not intercept in all contexts.

### LastPass

| Platform | Dialog Mode | Relay Mode | Self-Hosted Dialog |
|----------|-------------|------------|-------------------|
| All platforms | ❌ | ❌ | ❌ |

**Status:** No passkey support as of January 2026.

---

## Platform Authenticators

### Windows Hello

**Supported:**
- Windows 10 (1903+) or Windows 11
- Biometric (fingerprint/facial recognition) or PIN

**Compatibility:**
- Dialog mode: ✅
- Relay mode: ✅
- Self-hosted dialog: ✅

**Browser support:** Edge, Chrome, Firefox

### Touch ID / Face ID (macOS)

**Supported:**
- macOS 13+ (Ventura or later)
- Device with Touch ID or Face ID

**Compatibility:**
- Dialog mode: ✅
- Relay mode: ✅
- Self-hosted dialog: ✅

**Browser support:** Safari (primary), Chrome (fallback)

### Android Biometric

**Supported:**
- Android 9+ (Pie or later)
- Fingerprint, face unlock, or screen lock

**Compatibility:**
- Dialog mode: ✅
- Relay mode: ✅
- Self-hosted dialog: ✅

**Browser support:** Chrome, Edge

---

## Villa Implementation

### Current Architecture (2026-01-10)

| Context | Mode | Rationale |
|---------|------|-----------|
| villa.cash onboarding | Dialog (Porto-hosted) | Temporary: 1Password support priority |
| villa.cash login | Dialog (Porto-hosted) | Temporary: 1Password support priority |
| SDK iframe | Relay | Only viable option (nested iframe) |

### Planned Migration

**Target:** Self-hosted dialog for main flows

```typescript
// villa.cash (main flows)
const porto = await getPortoInstance({
  mode: Mode.dialog({
    host: 'https://key.villa.cash/auth',
    renderer: Dialog.popup({
      width: 400,
      height: 600,
    }),
  }),
})

// key.villa.cash/auth (dialog page)
const porto = await getPortoInstance({
  mode: Mode.rpcServer({
    keystoreHost: 'key.villa.cash',
  }),
})
```

**Benefits:**
- ✅ 1Password support maintained
- ✅ Custom domain (key.villa.cash)
- ✅ Full UI customization
- ✅ Same UX as current dialog mode

---

## Testing Strategy

### E2E Tests (Automated)

**What they test:**
- ✅ WebAuthn API calls succeed
- ✅ Passkey creation/authentication flow
- ✅ Error handling

**What they DON'T test:**
- ❌ 1Password interception
- ❌ Real biometric prompts
- ❌ Password manager UX

**Why:**
Playwright runs in headless Chromium without real biometric hardware or password manager extensions.

### Manual Testing (Required)

**Before ANY Porto mode change:**

```bash
# 1. Deploy to staging
pnpm build && git push origin main

# 2. Test with real devices
# iOS + Safari + 1Password
# Android + Chrome + 1Password
# macOS + Chrome + 1Password
# Windows + Edge + 1Password

# 3. Verify password manager intercepted
# - 1Password prompt appeared
# - Biometric unlock requested
# - Passkey saved to 1Password vault
```

**Checklist:**
- [ ] 1Password extension installed
- [ ] Biometric unlock enabled
- [ ] Create new passkey
- [ ] Verify 1Password prompt appears
- [ ] Check passkey saved in 1Password vault
- [ ] Sign out and sign in again
- [ ] Verify 1Password can retrieve passkey

---

## Troubleshooting

### 1Password Doesn't Trigger

**Symptoms:**
- Native biometric prompt appears instead of 1Password
- No 1Password UI during passkey creation

**Causes:**
1. Relay mode used (1Password can't intercept)
2. 1Password extension not installed/enabled
3. Wrong browser/platform combination

**Fix:**
- Use dialog or self-hosted dialog mode
- Verify extension is active (check toolbar)
- Use supported browser (Chrome/Safari/Edge)

### Passkeys Created But Not Syncing

**Symptoms:**
- Passkey works on one device but not others
- "No passkey found" error on different device

**Causes:**
1. Using platform authenticator (device-bound)
2. Password manager sync disabled
3. Different keystoreHost domains

**Fix:**
- Ensure password manager sync is enabled
- Use same keystoreHost across environments
- Check passkey is in password manager vault

### WebAuthn API Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `NotAllowedError` | No user gesture | Ensure click event triggers flow |
| `SecurityError` | HTTP (not HTTPS) | Use HTTPS in dev: `pnpm dev:https` |
| `NotSupportedError` | Browser too old | Require Chrome 108+/Safari 16+ |
| `InvalidStateError` | Passkey already exists | Handle duplicate registration |

---

## References

- [Porto SDK Documentation](https://porto.sh/sdk)
- [WebAuthn Guide](https://webauthn.guide)
- [1Password Passkeys](https://support.1password.com/passkeys)
- [LEARNINGS.md Pattern 50](/Users/me/Documents/Coding/villa/.claude/LEARNINGS.md#50-porto-mode-selection-pattern-critical---2026-01-08-updated-2026-01-10)

---

**Last Updated:** 2026-01-10
**Maintained By:** Villa Engineering
