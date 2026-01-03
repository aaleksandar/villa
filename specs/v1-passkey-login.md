# V1: Passkey Login

**Status:** IN PROGRESS
**Design:** Pending (Porto SDK theming)

## Goal

Let users create a Villa identity with one tap using Face ID or fingerprint. No passwords, no email, no phone number. Porto SDK handles the passkey, we wrap it with Villa theming.

## User Experience

1. User opens Villa, sees welcome: "Your identity. No passwords."
2. User taps "Get Started"
3. Brief explainer: "Use Face ID to create your secure identity"
4. User taps "Create Identity"
5. Porto dialog appears (Villa-themed)
6. Native biometric prompt (Face ID / Touch ID / fingerprint)
7. Success! Identity created
8. User enters display name (required)
9. User optionally picks avatar
10. Done → Home screen

## Screens

- **Welcome:** Value prop, single CTA
- **Explainer:** One visual, one sentence, CTA
- **Loading:** While Porto initializes (~1-2s)
- **Biometric:** Native OS prompt (Porto handles)
- **Success:** Celebration moment
- **Profile:** Display name input, avatar picker
- **Error:** What went wrong, how to retry

## States

- Loading (Porto init, biometric processing)
- Error (biometric failed, network error, timeout)
- Offline (welcome/explainer work, Porto needs network)
- Success (identity created)

## Technical

**Data stored locally:**
- Porto address
- Display name (1-50 chars)
- Avatar (local file or generated)
- Created timestamp

**Dependencies:**
- Porto SDK: passkey creation, WebAuthn
- No backend for v1 (local-only)

**Security:**
- Passkeys in device secure enclave (never leave)
- Display name sanitized (no XSS)
- Avatar processed locally (never uploaded)

**Performance:**
- Porto init: ~1-2s (show loading)
- Biometric: ~2-3s (show feedback)
- Welcome/explainer: work offline

## Tasks

- [ ] Set up Porto SDK with Villa theming
- [ ] Create welcome screen
- [ ] Create explainer screen
- [ ] Create loading/success states
- [ ] Create profile setup (name, avatar)
- [ ] Add local storage persistence
- [ ] Write E2E tests for full flow
- [ ] Write security tests
- [ ] Test on iOS Safari, Android Chrome
- [ ] Test offline behavior

## Acceptance Criteria

- [ ] User creates passkey with biometric
- [ ] Works on iOS Safari (Face ID / Touch ID)
- [ ] Works on Android Chrome (fingerprint)
- [ ] Display name required before completion
- [ ] Biometric failure shows helpful error
- [ ] No passwords anywhere in flow
- [ ] E2E tests pass
- [ ] Security tests pass

## Out of Scope (v1)

- Recovery (Phase 2)
- Community features (Phase 3)
- AI assistant (Phase 4)
- Multi-device sync UI (Porto handles)
