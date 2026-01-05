# @rockfridrich/villa-sdk-react

React bindings for Villa SDK. Privacy-first passkey authentication for Base network.

[![npm version](https://img.shields.io/npm/v/@rockfridrich/villa-sdk-react.svg)](https://www.npmjs.com/package/@rockfridrich/villa-sdk-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install @rockfridrich/villa-sdk @rockfridrich/villa-sdk-react viem zod
```

## Quick Start

```tsx
import { VillaProvider, VillaAuth, useIdentity } from '@rockfridrich/villa-sdk-react'

function App() {
  return (
    <VillaProvider config={{ appId: 'your-app' }}>
      <AuthenticatedApp />
    </VillaProvider>
  )
}

function AuthenticatedApp() {
  const identity = useIdentity()
  const { signOut } = useAuth()

  if (!identity) {
    return (
      <VillaAuth
        onComplete={(result) => {
          if (result.success) {
            console.log('Welcome', result.identity.nickname)
          }
        }}
      />
    )
  }

  return (
    <div>
      <Avatar identity={identity} size={48} />
      <h1>Welcome, @{identity.nickname}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

## API

### Provider

```tsx
<VillaProvider config={{ appId: 'your-app', network: 'base' }}>
  {children}
</VillaProvider>
```

### Hooks

```tsx
// Get current user
const identity = useIdentity()

// Auth state and methods
const { signIn, signOut, isAuthenticated, isLoading } = useAuth()

// SDK config
const config = useVillaConfig()
```

### Components

```tsx
// Auth button (triggers full flow)
<VillaAuth
  onComplete={(result) => { /* handle result */ }}
  buttonText="Sign In"
/>

// Display avatar
<Avatar identity={user} size={48} />

// Preview avatar config
<AvatarPreview
  walletAddress="0x..."
  selection="female"
  variant={2}
  size={64}
/>
```

## Types

```typescript
interface Identity {
  address: `0x${string}`
  nickname: string
  avatar: AvatarConfig
}

type VillaAuthResponse =
  | { success: true; identity: Identity }
  | { success: false; error: string; code: SignInErrorCode }
```

## Links

- [Documentation](https://developers.villa.cash)
- [Core SDK](https://www.npmjs.com/package/@rockfridrich/villa-sdk)
- [GitHub](https://github.com/rockfridrich/villa)

## License

MIT
