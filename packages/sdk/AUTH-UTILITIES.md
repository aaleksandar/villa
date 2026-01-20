# Villa SDK - Authentication Utilities

Framework-agnostic utilities for WebAuthn passkey authentication, browser capability detection, and Porto configuration.

## Overview

The Villa SDK provides low-level utilities for building custom authentication flows with passkeys. These utilities are framework-agnostic and work in any JavaScript environment (React, Vue, vanilla JS, etc.).

## Installation

```bash
npm install @rockfridrich/villa-sdk viem zod
```

## WebAuthn Error Handling

### `parseWebAuthnError(error: unknown): WebAuthnError`

Parse WebAuthn errors into structured, user-friendly messages.

```typescript
import { parseWebAuthnError, WebAuthnErrorCode } from '@rockfridrich/villa-sdk'

try {
  const credential = await navigator.credentials.create(options)
} catch (error) {
  const webAuthnError = parseWebAuthnError(error)
  
  // Machine-readable error code
  console.log(webAuthnError.code) // WebAuthnErrorCode.USER_CANCELLED
  
  // User-friendly message
  console.log(webAuthnError.userMessage) // "Authentication was cancelled"
  
  // Whether to display error to user
  if (webAuthnError.shouldDisplay) {
    showError(webAuthnError.userMessage)
  }
}
```

### Error Codes

```typescript
enum WebAuthnErrorCode {
  USER_CANCELLED = 'user_cancelled',      // User cancelled operation
  TIMEOUT = 'timeout',                    // Operation timed out
  NOT_ALLOWED = 'not_allowed',            // Not allowed in context
  INVALID_STATE = 'invalid_state',        // Credential already exists
  NETWORK_ERROR = 'network_error',        // Network error
  NOT_SUPPORTED = 'not_supported',        // WebAuthn not supported
  UNKNOWN = 'unknown',                    // Unknown error
}
```

## Browser Capability Detection

### `detectBrowserCapabilities(): Promise<BrowserCapabilities>`

Detect what passkey features are available in the browser.

```typescript
import { detectBrowserCapabilities } from '@rockfridrich/villa-sdk'

const capabilities = await detectBrowserCapabilities()

if (capabilities.webAuthnSupported) {
  console.log('WebAuthn is supported!')
}

if (capabilities.platformAuthenticatorAvailable) {
  console.log('Touch ID/Face ID available')
}

if (capabilities.conditionalUIAvailable) {
  console.log('Autofill UI available')
}

console.log('Available passkey managers:', capabilities.passkeyManagers)
// ['platform', 'icloud', '1password']
```

### `isPasskeySupported(): boolean`

Quick check if passkeys are supported.

```typescript
import { isPasskeySupported } from '@rockfridrich/villa-sdk'

if (!isPasskeySupported()) {
  showError('Passkeys are not supported in this browser')
}
```

## Passkey Manager Detection

### Passkey Manager Types

```typescript
enum PasskeyManagerType {
  PLATFORM = 'platform',       // Touch ID, Face ID, Windows Hello
  ONE_PASSWORD = '1password',  // 1Password extension
  ICLOUD = 'icloud',          // iCloud Keychain
  GOOGLE = 'google',          // Google Password Manager
  FIDO2 = 'fido2',           // FIDO2 security key
  UNKNOWN = 'unknown',        // Unknown/unsupported
}
```

### `getPasskeyManagerName(type: PasskeyManagerType): string`

Get user-friendly names for passkey managers.

```typescript
import { getPasskeyManagerName, PasskeyManagerType } from '@rockfridrich/villa-sdk'

const name = getPasskeyManagerName(PasskeyManagerType.ICLOUD)
console.log(name) // "iCloud Keychain"
```

## Porto Configuration Helpers

### `validatePortoConfig(config: PortoConfig): boolean`

Validate a Porto configuration before use.

```typescript
import { validatePortoConfig } from '@rockfridrich/villa-sdk'

const config = {
  mode: 'dialog',
  chainId: 8453, // Base mainnet
}

try {
  validatePortoConfig(config)
  console.log('Config is valid!')
} catch (error) {
  console.error('Invalid config:', error.message)
}
```

### `getChainConfig(chainId: number)`

Get chain configuration for Base or Base Sepolia.

```typescript
import { getChainConfig } from '@rockfridrich/villa-sdk'

const baseConfig = getChainConfig(8453)
console.log(baseConfig.name) // "Base"
console.log(baseConfig.rpcUrls.default.http[0]) // "https://mainnet.base.org"

const sepoliaConfig = getChainConfig(84532)
console.log(sepoliaConfig.name) // "Base Sepolia"
```

### `getPortoHost(mode: PortoMode): string`

Get the correct Porto host URL for a given mode.

```typescript
import { getPortoHost } from '@rockfridrich/villa-sdk'

const dialogHost = getPortoHost('dialog')
console.log(dialogHost) // "https://id.porto.sh/dialog"

const relayHost = getPortoHost('relay')
console.log(relayHost) // "https://id.porto.sh/relay"
```

### `createVillaTheme(): PortoThemeConfig`

Get Villa's default theme configuration for Porto.

```typescript
import { createVillaTheme } from '@rockfridrich/villa-sdk'

const theme = createVillaTheme()
console.log(theme.accent) // "#ffe047" (Villa yellow)
console.log(theme.colorScheme) // "light"
```

## Complete Example: Custom Auth UI

```typescript
import {
  detectBrowserCapabilities,
  parseWebAuthnError,
  isPasskeySupported,
  getPasskeyManagerName,
  PasskeyManagerType,
  WebAuthnErrorCode,
} from '@rockfridrich/villa-sdk'

async function initializeAuth() {
  // Check basic support
  if (!isPasskeySupported()) {
    showError('Passkeys are not supported in this browser')
    return
  }

  // Detect capabilities
  const capabilities = await detectBrowserCapabilities()

  // Show available authentication methods
  if (capabilities.platformAuthenticatorAvailable) {
    showAuthOption('biometric', 'Sign in with Touch ID or Face ID')
  }

  // Show passkey manager badges
  capabilities.passkeyManagers.forEach(manager => {
    const name = getPasskeyManagerName(manager)
    showManagerBadge(name)
  })
}

async function signInWithPasskey() {
  try {
    // Your WebAuthn authentication logic
    const assertion = await navigator.credentials.get({
      publicKey: options,
    })
    
    // Success
    handleSuccess(assertion)
  } catch (error) {
    const webAuthnError = parseWebAuthnError(error)
    
    // Handle specific error cases
    switch (webAuthnError.code) {
      case WebAuthnErrorCode.USER_CANCELLED:
        // Don't show error for user cancellation
        break
      
      case WebAuthnErrorCode.TIMEOUT:
        showError('Authentication timed out. Please try again.')
        break
      
      case WebAuthnErrorCode.NOT_SUPPORTED:
        showError('Passkeys are not supported in this browser')
        break
      
      default:
        if (webAuthnError.shouldDisplay) {
          showError(webAuthnError.userMessage)
        }
    }
  }
}
```

## TypeScript Types

All utilities are fully typed with TypeScript:

```typescript
interface BrowserCapabilities {
  webAuthnSupported: boolean
  platformAuthenticatorAvailable: boolean
  conditionalUIAvailable: boolean
  userVerifyingPlatformAuthenticator: boolean
  passkeyManagers: PasskeyManagerType[]
}

interface WebAuthnError {
  code: WebAuthnErrorCode
  originalMessage: string
  userMessage: string
  shouldDisplay: boolean
}

interface PortoConfig {
  mode: PortoMode
  chainId: number
  theme?: PortoThemeConfig
  keystoreHost?: string
}

interface PortoThemeConfig {
  colorScheme?: 'light' | 'dark'
  accent?: string
  primaryBackground?: string
  primaryContent?: string
  baseBackground?: string
  baseContent?: string
  frameRadius?: number
}

type PortoMode = 'dialog' | 'relay' | 'iframe'
```

## Related Documentation

- [Villa SDK README](./README.md) - Main SDK documentation
- [WebAuthn API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) - MDN WebAuthn reference
- [Porto SDK](https://porto.sh/sdk) - Porto authentication SDK

## Support

- [GitHub Issues](https://github.com/rockfridrich/villa/issues)
- [Developer Documentation](https://developers.villa.cash)
- [Discord Community](https://discord.gg/villa)
