# Villa Integration Guide

> **Status:** Coming after v1 testing
>
> This guide will help other village projects integrate Villa for passkey authentication.

## What Villa Provides

Villa wraps Porto SDK with custom theming, giving your app:

- Passwordless authentication (Face ID, Touch ID, fingerprint)
- Consistent identity across village projects
- Privacy-first design

## Planned Integration (Post v1)

```typescript
// Future API — design not final
import { VillaAuth } from '@villa/sdk'

function LoginButton() {
  return (
    <VillaAuth
      onSuccess={(identity) => {
        console.log('Logged in:', identity.address)
        console.log('Name:', identity.displayName)
      }}
      onError={(error) => {
        console.error('Auth failed:', error)
      }}
      theme="village" // Villa theming
    />
  )
}
```

## Timeline

1. **Now:** Building and testing v1 core app
2. **After v1:** Gather feedback from first users
3. **Then:** Design and document SDK API
4. **Finally:** Release integration package

## Want to Help Shape This?

Open an issue with the `discussion` label to share:
- What your project needs from Villa auth
- Your preferred integration patterns
- Any concerns or requirements

## Stay Updated

- Watch the [BACKLOG.md](../BACKLOG.md) for SDK progress
- Join [Telegram](https://t.me/proofofretreat) for updates
