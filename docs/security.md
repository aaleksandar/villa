# Security Model

Villa's security is non-negotiable. This document describes our security guarantees.

## Core Guarantees

### Passkeys Never Leave Device

- Stored in device secure enclave (iOS Keychain, Android Keystore)
- WebAuthn standard — phishing resistant, domain-bound
- Porto SDK handles all cryptographic operations
- No password database to breach

### No Passwords

- Zero passwords stored anywhere
- No "forgot password" flows that weaken security
- Biometric-only authentication
- Device is the credential

### Local-First Data

- Identity data stored on-device only (v1)
- No server stores your profile
- No cloud sync without explicit consent
- You control your data

### Biometric Processing On-Device

- Face/fingerprint never leaves device
- Neural network inference runs locally
- Only cryptographic proofs transmitted
- Raw biometrics deleted after use

## Threat Model

### What We Protect Against

| Threat | Protection |
|--------|------------|
| Password theft | No passwords to steal |
| Phishing | Passkeys are domain-bound |
| Credential stuffing | No credentials database |
| Server breach | No sensitive data on server |
| Man-in-middle | TLS required, signature verification |
| XSS | Input sanitization, CSP headers |
| Session hijacking | Short-lived tokens, secure storage |

### What Requires User Action

| Situation | User Responsibility |
|-----------|---------------------|
| Device loss | Use recovery (Phase 2) |
| Device compromise | Device security is user's responsibility |
| Sharing credentials | Don't share your device biometrics |

## Implementation Requirements

### Every PR Must

- [ ] Pass security checklist (`.claude/templates/security-checklist.md`)
- [ ] No hardcoded secrets
- [ ] Input validation at boundaries
- [ ] No PII in logs
- [ ] Use approved crypto libraries only

### Approved Libraries

- **Crypto:** libsodium, noble-curves
- **Validation:** Zod
- **Auth:** Porto SDK (WebAuthn)

### Forbidden

- Custom cryptographic implementations
- Storing passwords or password hashes
- Logging PII or wallet addresses
- Transmitting biometric data
- Disabling security for convenience

## Reporting Security Issues

Found a vulnerability? Please report privately:

1. **Do NOT** create a public GitHub issue
2. Email: [security contact TBD]
3. Include: steps to reproduce, impact assessment
4. We'll respond within 48 hours

## Audits

- [ ] Internal security review (before v1 deploy)
- [ ] External audit (planned for Phase 2)
