# Privacy Guarantees

Villa is privacy-first. This document explains exactly what data goes where.

## What Stays On Your Device

| Data | Storage | Shared? |
|------|---------|---------|
| Passkey private key | Secure enclave | Never |
| Display name | Local storage | Never (v1) |
| Avatar | Local file | Never (v1) |
| Biometric data | Never stored | Never |

## What We Never Do

- **Never** store your biometric data (face, fingerprint)
- **Never** upload data without explicit consent
- **Never** track your location in background
- **Never** sell or monetize your data
- **Never** share data with advertisers
- **Never** require email or phone number

## Consent Model

When we need to share data (future phases), we will:

1. **Ask explicitly** — Clear dialog, not buried in settings
2. **Explain what** — Exactly which data
3. **Explain why** — What it's used for
4. **Explain where** — Who receives it
5. **Make it revocable** — You can undo at any time

## Future Phases

### Phase 2: Recovery

- Face recovery: biometric processed on-device, only cryptographic helper string stored
- Guardian recovery: guardian identities protected with ZK proofs

### Phase 3: Community

- ZK membership proofs: prove you belong without revealing who you are
- Location: only shared when you explicitly check in

### Phase 4: AI

- Local AI: runs entirely on device
- Cloud AI: only with explicit consent per conversation

## Your Rights

- **Access:** See all data we have about you
- **Delete:** Remove your data entirely
- **Export:** Download your data in standard format
- **Revoke:** Withdraw any consent at any time

## Questions?

Open an issue on [GitHub](https://github.com/rockfridrich/villa/issues) or ask in our [Telegram](https://t.me/proofofretreat).
