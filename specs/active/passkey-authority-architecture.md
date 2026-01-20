# Villa Passkey Authority Architecture

**Spec ID:** ARCH-007
**Status:** ACTIVE
**Created:** 2026-01-20
**Owner:** Rocky

---

## Executive Summary

Make **key.villa.cash** (served by `/auth` route) the WebAuthn Relying Party for Villa identity. External apps integrate via SDK iframe, authenticate through Villa's passkey system, and receive signed identity. Porto SDK provides smart account infrastructure only.

**Key Decision:** Use `rpId: 'villa.cash'` (parent domain) so passkeys work across all Villa subdomains while being managed through `key.villa.cash/auth`.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL APP (lovable.dev, myapp.com)                │
│                                                                         │
│  import { Villa } from '@rockfridrich/villa-sdk'                        │
│  const result = await villa.signIn()                                    │
│                                                                         │
│  Receives: { address, nickname, avatar }                                │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (1) SDK creates iframe
┌─────────────────────────────────────────────────────────────────────────┐
│                      VILLA SDK (npm package)                            │
│                                                                         │
│  VillaBridge creates fullscreen iframe:                                 │
│  src="https://key.villa.cash/auth?appId=xxx&origin=https://lovable.dev" │
│                                                                         │
│  iframe permissions: allow="publickey-credentials-get *;                │
│                             publickey-credentials-create *"             │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (2) iframe loads auth page
┌─────────────────────────────────────────────────────────────────────────┐
│            key.villa.cash/auth (hub app /auth route)                    │
│                                                                         │
│  VillaAuthScreen component uses Porto RELAY mode:                       │
│  - keystoreHost: 'villa.cash' → sets WebAuthn rpId                      │
│  - Custom WebAuthn handlers → Villa-controlled UI                       │
│  - rp.name override → "Villa" shown in passkey managers                 │
│                                                                         │
│  Origin validation: Only registered apps in allowlist                   │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (3) WebAuthn ceremony (browser-native)
┌─────────────────────────────────────────────────────────────────────────┐
│                        BROWSER WebAuthn API                             │
│                                                                         │
│  navigator.credentials.create/get({                                     │
│    publicKey: {                                                         │
│      rp: { id: 'villa.cash', name: 'Villa' },                           │
│      user: { ... },                                                     │
│      challenge: <from Porto>,                                           │
│      ...                                                                │
│    }                                                                    │
│  })                                                                     │
│                                                                         │
│  Result:                                                                │
│  - Passkey stored under "villa.cash" domain                             │
│  - User sees "Villa" in iCloud Keychain / Google Password Manager       │
│  - Works with native passkey UI (1Password may not intercept in relay)  │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (4) Porto derives smart account
┌─────────────────────────────────────────────────────────────────────────┐
│                     PORTO INFRASTRUCTURE                                │
│                                                                         │
│  What Porto provides:                                                   │
│  - Challenge generation for WebAuthn                                    │
│  - Deterministic address derivation from passkey signature              │
│  - Smart account contracts (EIP-7702)                                   │
│  - Bundler/relayer for gas sponsorship                                  │
│  - On-chain signature verification                                      │
│                                                                         │
│  What Porto does NOT control:                                           │
│  - Passkey storage (owned by villa.cash domain)                         │
│  - WebAuthn RP ID (set by Villa via keystoreHost)                       │
│  - Authentication UI (Villa's VillaAuthScreen)                          │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (5) postMessage to parent
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL APP (lovable.dev)                           │
│                                                                         │
│  window.addEventListener('message', (e) => {                            │
│    if (e.origin !== 'https://key.villa.cash') return                    │
│    if (e.data.type === 'VILLA_AUTH_SUCCESS') {                          │
│      const { address, nickname, avatar } = e.data.payload.identity      │
│      // User authenticated!                                             │
│    }                                                                    │
│  })                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Domain & DNS Configuration

### Current Setup (DigitalOcean App Platform)

| Domain                  | Type    | Routes To           | Purpose               |
| ----------------------- | ------- | ------------------- | --------------------- |
| `villa.cash`            | PRIMARY | hub app             | Main Villa app        |
| `key.villa.cash`        | ALIAS   | hub app `/auth`     | Passkey auth endpoint |
| `beta.villa.cash`       | PRIMARY | staging hub         | Staging               |
| `beta-key.villa.cash`   | ALIAS   | staging hub `/auth` | Staging auth          |
| `developers.villa.cash` | PRIMARY | developers app      | Dev portal            |

### CloudFlare DNS Records (Required)

```
Type  Name              Content                              Proxy
A     villa.cash        <DO App IP>                          Yes
CNAME key               villa.cash                           Yes
CNAME beta              <DO Staging App>                     Yes
CNAME beta-key          beta.villa.cash                      Yes
CNAME www               villa.cash                           Yes
CNAME developers        <DO Developers App>                  Yes
```

### TLS/HTTPS

- CloudFlare provides edge TLS termination
- WebAuthn requires secure context (HTTPS) - satisfied
- No special DNS records needed for WebAuthn

---

## WebAuthn Configuration

### RP ID Strategy

**Decision: Use `villa.cash` (parent domain)**

```typescript
// Porto relay mode configuration
Mode.relay({
  keystoreHost: "villa.cash", // This becomes the WebAuthn rpId
  webAuthn: {
    createFn: async (options) => {
      // Override rp.name for display
      if (options?.publicKey?.rp) {
        options.publicKey.rp.name = "Villa";
      }
      return navigator.credentials.create(options);
    },
    getFn: async (options) => {
      return navigator.credentials.get(options);
    },
  },
});
```

**Why `villa.cash` not `key.villa.cash`:**

1. **WebAuthn spec allows parent domain**: Origin `key.villa.cash` can use rpId `villa.cash`
2. **Cross-subdomain compatibility**: Same passkey works on hub, key, beta, developers
3. **Cleaner UX**: Users see "villa.cash" in passkey managers, not "key.villa.cash"
4. **Future-proof**: If we add more subdomains, passkeys still work

### Credential Binding

```
Passkey Created On: key.villa.cash (origin)
Passkey Bound To: villa.cash (rpId)
Passkey Usable On: *.villa.cash (any subdomain of rpId)
```

---

## Security Model

### Origin Validation (Allowlist)

```typescript
// apps/hub/src/app/auth/page.tsx
const VILLA_ORIGINS = [
  "https://villa.cash",
  "https://www.villa.cash",
  "https://beta.villa.cash",
  "https://key.villa.cash",
  "https://beta-key.villa.cash",
  "https://developers.villa.cash",
] as const;

const DEV_ORIGINS = [
  "https://localhost",
  "https://localhost:3000",
  "https://localhost:3001",
  "http://localhost:3000",
] as const;

const REGISTERED_APP_ORIGINS = [
  "https://lovable.dev",
  "https://www.lovable.dev",
  // Apps register via developers.villa.cash
] as const;
```

### App Registration Process

1. Developer visits `developers.villa.cash`
2. Creates app, provides origin(s)
3. Villa reviews and approves
4. Origin added to `REGISTERED_APP_ORIGINS`
5. App can now use Villa SDK

### postMessage Security

```typescript
// NEVER use '*' - always specify exact origin
const postToParent = (message: object) => {
  const targetOrigin = getValidatedParentOrigin(); // From allowlist only
  if (!targetOrigin) return; // Refuse to post to unknown origins

  const target = isPopup ? window.opener : window.parent;
  target.postMessage(message, targetOrigin);
};
```

### CSP Configuration

```typescript
// apps/hub/next.config.js and apps/key/next.config.js
headers: [
  {
    source: "/auth",
    headers: [
      {
        key: "Content-Security-Policy",
        // Allow embedding by registered apps
        value: [
          "frame-ancestors 'self'",
          "*.villa.cash",
          "villa.cash",
          "lovable.dev",
          "*.lovable.dev",
          "localhost:*",
        ].join(" "),
      },
    ],
  },
];
```

### Session Security

**No traditional session tokens needed:**

1. **Passkey = proof of identity**: WebAuthn signature proves user controls the passkey
2. **Address = deterministic**: Same passkey always derives same Ethereum address
3. **Fresh auth each time**: SDK opens iframe → user authenticates → immediate result

**Optional: SIWE for apps needing verifiable sessions:**

```typescript
// After passkey auth, sign SIWE message
const siweMessage = generateSiweMessage({
  address,
  domain: requestingAppDomain,
  nonce: crypto.randomUUID(),
  statement: "Sign in with Villa",
});
const signature = await signMessageHeadless(siweMessage, address);

postToParent({
  type: "VILLA_AUTH_SUCCESS",
  payload: {
    identity: { address, nickname, avatar },
    siwe: { message: siweMessage, signature }, // App can verify
  },
});
```

---

## Implementation Changes

### 1. apps/hub/src/lib/porto.ts

Current `keystoreHost` is already `'villa.cash'`. Verify relay mode is used:

```typescript
// Line ~218 - CORRECT
const VILLA_KEYSTORE_HOST = "villa.cash";

// Line ~234-270 - getPortoRelay() - CORRECT implementation
export function getPortoRelay(): ReturnType<typeof Porto.create> {
  if (!portoRelayInstance) {
    portoRelayInstance = Porto.create({
      chains: getPortoChains(),
      mode: Mode.relay({
        keystoreHost: VILLA_KEYSTORE_HOST, // ✓ villa.cash
        webAuthn: {
          createFn: async (options) => {
            if (options?.publicKey?.rp) {
              options.publicKey.rp.name = "Villa"; // ✓ Override display name
            }
            await webAuthnHandlers.onPasskeyCreate?.(options);
            return navigator.credentials.create(options);
          },
          getFn: async (options) => {
            await webAuthnHandlers.onPasskeyGet?.(options);
            return navigator.credentials.get(options);
          },
        },
      }),
    });
  }
  return portoRelayInstance;
}
```

### 2. apps/hub/src/app/auth/page.tsx

Already uses `VillaAuthScreen` which calls relay mode. **No changes needed.**

### 3. apps/key/src/lib/porto.ts

Currently uses dialog mode. Should be deprecated or updated to relay mode:

```typescript
// CHANGE FROM dialog mode
mode: Mode.dialog({
  host: 'https://id.porto.sh/dialog',  // ❌ Porto's domain
})

// TO relay mode (match hub)
mode: Mode.relay({
  keystoreHost: 'villa.cash',  // ✓ Villa's domain
  webAuthn: { ... }
})
```

**Note:** apps/key is currently not deployed separately - hub handles `/auth`. Consider deprecating apps/key or merging.

### 4. SDK iframe/bridge.ts

Update AUTH_URLS to use key subdomains:

```typescript
// packages/sdk/src/iframe/bridge.ts
const AUTH_URLS = {
  production: "https://key.villa.cash/auth",
  staging: "https://beta-key.villa.cash/auth",
  development: "https://localhost:3000/auth",
} as const;
```

### 5. CSP Updates for External Apps

```typescript
// apps/hub/next.config.js
async headers() {
  return [
    {
      source: '/auth',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "frame-ancestors 'self' *.villa.cash villa.cash lovable.dev *.lovable.dev localhost:*",
        },
        {
          key: 'X-Frame-Options',
          value: 'ALLOWALL',  // Override SAMEORIGIN for /auth only
        },
      ],
    },
  ]
}
```

---

## Trade-offs

### 1Password Support

**Current state (dialog mode):** 1Password browser extension intercepts Porto's dialog iframe

**With relay mode:** 1Password may NOT intercept because:

- No Porto dialog iframe for extension to hook into
- Direct `navigator.credentials.create/get` calls are harder to intercept

**Mitigation:**

- Users can still use iCloud Keychain, Google Password Manager, Windows Hello
- These work natively with WebAuthn
- Consider future investigation into 1Password SDK integration

### Existing Passkeys

Users with passkeys bound to `id.porto.sh` (from dialog mode) will need to create new passkeys.

**Migration path:**

1. Detect existing Porto session
2. Prompt user to "upgrade" to Villa passkey
3. Create new passkey under `villa.cash` rpId
4. Both work during transition period

---

## Verification Checklist

### Before Deployment

- [ ] `keystoreHost` set to `'villa.cash'` in porto.ts
- [ ] Auth page uses `VillaAuthScreen` (relay mode)
- [ ] CSP allows registered external app origins
- [ ] Origin allowlist includes registered apps
- [ ] SDK bridge points to `key.villa.cash/auth`

### After Deployment

- [ ] Test passkey creation on beta.villa.cash
- [ ] Verify passkey shows "Villa" in passkey manager
- [ ] Test cross-origin auth from external app
- [ ] Verify postMessage receives identity
- [ ] Test on iOS Safari (strictest WebAuthn)
- [ ] Test on Android Chrome

---

## Future Enhancements

### Phase 2: SIWE Integration

- Add signed SIWE message to auth response
- Apps can verify signature server-side
- Enables proper session tokens

### Phase 3: App-Specific Scopes

- Apps request specific data scopes
- Users consent to data sharing
- Villa returns only consented data

### Phase 4: Credential Aggregation

- Multiple passkeys per user
- Device management UI
- Recovery passkey flow

---

## Links

- [WebAuthn Spec (W3C)](https://www.w3.org/TR/webauthn-2/)
- [Porto SDK Docs](https://porto.sh/sdk)
- [Vision: zkID + Passkey](../reference/vision-zkid-passkey.md)
- [Production Roadmap](./production-roadmap.md)
