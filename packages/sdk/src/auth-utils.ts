/**
 * @villa/sdk - Auth Utilities
 *
 * Framework-agnostic authentication utilities for WebAuthn and passkey management.
 * These utilities can be used in any JavaScript environment (React, Vue, vanilla JS, etc.)
 */

/** Passkey manager types detected in the browser */
export enum PasskeyManagerType {
  /** Platform authenticator (Touch ID, Face ID, Windows Hello) */
  PLATFORM = 'platform',
  /** 1Password browser extension */
  ONE_PASSWORD = '1password',
  /** iCloud Keychain */
  ICLOUD = 'icloud',
  /** Google Password Manager */
  GOOGLE = 'google',
  /** Generic FIDO2 security key */
  FIDO2 = 'fido2',
  /** Unknown or unsupported */
  UNKNOWN = 'unknown',
}

/** Browser capabilities for passkey authentication */
export interface BrowserCapabilities {
  /** WebAuthn/PublicKeyCredential API is available */
  webAuthnSupported: boolean
  /** Platform authenticator (biometric) is available */
  platformAuthenticatorAvailable: boolean
  /** Conditional UI (autofill) is available */
  conditionalUIAvailable: boolean
  /** User verifying platform authenticator is available */
  userVerifyingPlatformAuthenticator: boolean
  /** Detected passkey managers */
  passkeyManagers: PasskeyManagerType[]
}

/** WebAuthn error codes */
export enum WebAuthnErrorCode {
  /** User cancelled the operation */
  USER_CANCELLED = 'user_cancelled',
  /** Operation timed out */
  TIMEOUT = 'timeout',
  /** Not allowed to use this feature */
  NOT_ALLOWED = 'not_allowed',
  /** Invalid state (e.g., credential already exists) */
  INVALID_STATE = 'invalid_state',
  /** Network error during ceremony */
  NETWORK_ERROR = 'network_error',
  /** WebAuthn not supported in this browser */
  NOT_SUPPORTED = 'not_supported',
  /** Unknown error */
  UNKNOWN = 'unknown',
}

/** Structured WebAuthn error with code and user-friendly message */
export interface WebAuthnError {
  /** Machine-readable error code */
  code: WebAuthnErrorCode
  /** Original error message */
  originalMessage: string
  /** User-friendly error message */
  userMessage: string
  /** Whether the error should be shown to the user */
  shouldDisplay: boolean
}

/**
 * Parse a WebAuthn error into a structured format
 * @param error - Error thrown during WebAuthn operation
 * @returns Structured error with code and user-friendly message
 */
export function parseWebAuthnError(error: unknown): WebAuthnError {
  if (!error || typeof error !== 'object') {
    return {
      code: WebAuthnErrorCode.UNKNOWN,
      originalMessage: String(error),
      userMessage: 'An unexpected error occurred',
      shouldDisplay: true,
    }
  }

  const err = error as { name?: string; message?: string }
  const name = err.name || ''
  const message = err.message || String(error)

  // User cancelled the operation
  if (
    name === 'NotAllowedError' ||
    message.toLowerCase().includes('cancel') ||
    message.toLowerCase().includes('abort')
  ) {
    return {
      code: WebAuthnErrorCode.USER_CANCELLED,
      originalMessage: message,
      userMessage: 'Authentication was cancelled',
      shouldDisplay: false, // Don't show cancellation as error
    }
  }

  // Timeout
  if (name === 'TimeoutError' || message.toLowerCase().includes('timeout')) {
    return {
      code: WebAuthnErrorCode.TIMEOUT,
      originalMessage: message,
      userMessage: 'Authentication timed out. Please try again.',
      shouldDisplay: true,
    }
  }

  // Not allowed
  if (name === 'NotAllowedError') {
    return {
      code: WebAuthnErrorCode.NOT_ALLOWED,
      originalMessage: message,
      userMessage: 'Passkey authentication is not allowed in this context',
      shouldDisplay: true,
    }
  }

  // Invalid state (credential already exists)
  if (name === 'InvalidStateError') {
    return {
      code: WebAuthnErrorCode.INVALID_STATE,
      originalMessage: message,
      userMessage: 'A passkey already exists for this account',
      shouldDisplay: true,
    }
  }

  // Network error
  if (name === 'NetworkError' || message.toLowerCase().includes('network')) {
    return {
      code: WebAuthnErrorCode.NETWORK_ERROR,
      originalMessage: message,
      userMessage: 'Network error occurred. Please check your connection.',
      shouldDisplay: true,
    }
  }

  // Not supported
  if (name === 'NotSupportedError') {
    return {
      code: WebAuthnErrorCode.NOT_SUPPORTED,
      originalMessage: message,
      userMessage: 'Passkeys are not supported in this browser',
      shouldDisplay: true,
    }
  }

  // Unknown error
  return {
    code: WebAuthnErrorCode.UNKNOWN,
    originalMessage: message,
    userMessage: 'Authentication failed. Please try again.',
    shouldDisplay: true,
  }
}

/**
 * Detect browser capabilities for passkey authentication
 * @returns Browser capabilities including WebAuthn support and available authenticators
 */
export async function detectBrowserCapabilities(): Promise<BrowserCapabilities> {
  // Check if WebAuthn is supported
  const webAuthnSupported =
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined'

  if (!webAuthnSupported) {
    return {
      webAuthnSupported: false,
      platformAuthenticatorAvailable: false,
      conditionalUIAvailable: false,
      userVerifyingPlatformAuthenticator: false,
      passkeyManagers: [],
    }
  }

  // Check for platform authenticator
  const platformAuthenticatorAvailable =
    await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()

  // Check for conditional UI (autofill)
  const conditionalUIAvailable =
    'isConditionalMediationAvailable' in window.PublicKeyCredential &&
    (await window.PublicKeyCredential.isConditionalMediationAvailable())

  // Detect passkey managers
  const passkeyManagers = detectPasskeyManagers()

  return {
    webAuthnSupported,
    platformAuthenticatorAvailable,
    conditionalUIAvailable,
    userVerifyingPlatformAuthenticator: platformAuthenticatorAvailable,
    passkeyManagers,
  }
}

/**
 * Detect available passkey managers in the browser
 * @returns Array of detected passkey manager types
 */
function detectPasskeyManagers(): PasskeyManagerType[] {
  const managers: PasskeyManagerType[] = []

  if (typeof window === 'undefined') {
    return managers
  }

  // Check for platform authenticator (Touch ID, Face ID, Windows Hello)
  if (window.PublicKeyCredential) {
    managers.push(PasskeyManagerType.PLATFORM)
  }

  // Check for 1Password (they inject specific properties)
  // @ts-expect-error - 1Password injects custom properties
  if (window._onePasswordExtension || window.onePassword) {
    managers.push(PasskeyManagerType.ONE_PASSWORD)
  }

  // Detect iCloud Keychain (Safari on macOS/iOS)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  if (isSafari && isApple) {
    managers.push(PasskeyManagerType.ICLOUD)
  }

  // Detect Google Password Manager (Chrome)
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
  if (isChrome) {
    managers.push(PasskeyManagerType.GOOGLE)
  }

  // If no specific manager detected, mark as unknown
  if (managers.length === 0) {
    managers.push(PasskeyManagerType.UNKNOWN)
  }

  return managers
}

/**
 * Check if the current browser supports passkey authentication
 * @returns True if passkeys are supported, false otherwise
 */
export function isPasskeySupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined'
  )
}

/**
 * Get user-friendly name for a passkey manager type
 * @param type - Passkey manager type
 * @returns Human-readable name
 */
export function getPasskeyManagerName(type: PasskeyManagerType): string {
  switch (type) {
    case PasskeyManagerType.PLATFORM:
      return 'Device Biometric'
    case PasskeyManagerType.ONE_PASSWORD:
      return '1Password'
    case PasskeyManagerType.ICLOUD:
      return 'iCloud Keychain'
    case PasskeyManagerType.GOOGLE:
      return 'Google Password Manager'
    case PasskeyManagerType.FIDO2:
      return 'Security Key'
    case PasskeyManagerType.UNKNOWN:
      return 'Unknown'
    default:
      return 'Unknown'
  }
}

/**
 * Porto configuration helpers
 */

/** Porto mode types */
export type PortoMode = 'dialog' | 'relay' | 'iframe'

/** Porto theme configuration fragment */
export interface PortoThemeConfig {
  /** Color scheme (light or dark) */
  colorScheme?: 'light' | 'dark'
  /** Accent color (hex) */
  accent?: string
  /** Primary button background */
  primaryBackground?: string
  /** Primary button text color */
  primaryContent?: string
  /** Base background color */
  baseBackground?: string
  /** Base text color */
  baseContent?: string
  /** Border radius for components */
  frameRadius?: number
}

/** Porto configuration options */
export interface PortoConfig {
  /** Porto mode (dialog, relay, or iframe) */
  mode: PortoMode
  /** Chain ID (8453 for Base, 84532 for Base Sepolia) */
  chainId: number
  /** Optional theme customization */
  theme?: PortoThemeConfig
  /** Keystore host for relay mode (domain where passkeys are registered) */
  keystoreHost?: string
}

/**
 * Get the appropriate Porto host URL based on mode
 * @param mode - Porto mode (dialog, relay, iframe)
 * @returns Porto host URL
 */
export function getPortoHost(mode: PortoMode): string {
  switch (mode) {
    case 'dialog':
      return 'https://id.porto.sh/dialog'
    case 'relay':
      return 'https://id.porto.sh/relay'
    case 'iframe':
      return 'https://id.porto.sh/dialog'
    default:
      return 'https://id.porto.sh/dialog'
  }
}

/**
 * Get chain configuration based on chain ID
 * @param chainId - Chain ID (8453 for Base, 84532 for Base Sepolia)
 * @returns Chain configuration
 */
export function getChainConfig(chainId: number): {
  id: number
  name: string
  network: string
  nativeCurrency: { name: string; symbol: string; decimals: number }
  rpcUrls: { default: { http: string[] } }
  blockExplorers: { default: { name: string; url: string } }
} {
  if (chainId === 84532) {
    return {
      id: 84532,
      name: 'Base Sepolia',
      network: 'base-sepolia',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
      blockExplorers: { default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' } },
    }
  }

  // Default to Base mainnet
  return {
    id: 8453,
    name: 'Base',
    network: 'base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
    blockExplorers: { default: { name: 'BaseScan', url: 'https://basescan.org' } },
  }
}

/**
 * Validate a Porto configuration
 * @param config - Porto configuration to validate
 * @returns True if valid, throws error if invalid
 */
export function validatePortoConfig(config: PortoConfig): boolean {
  if (!config.mode) {
    throw new Error('Porto mode is required')
  }

  if (!['dialog', 'relay', 'iframe'].includes(config.mode)) {
    throw new Error(`Invalid Porto mode: ${config.mode}`)
  }

  if (!config.chainId) {
    throw new Error('Chain ID is required')
  }

  if (![8453, 84532].includes(config.chainId)) {
    throw new Error(`Unsupported chain ID: ${config.chainId}. Must be 8453 (Base) or 84532 (Base Sepolia)`)
  }

  if (config.mode === 'relay' && !config.keystoreHost) {
    throw new Error('keystoreHost is required for relay mode')
  }

  return true
}

/**
 * Create a default Villa theme for Porto
 * @returns Porto theme configuration with Villa branding
 */
export function createVillaTheme(): PortoThemeConfig {
  return {
    colorScheme: 'light',
    accent: '#ffe047',
    primaryBackground: '#ffe047',
    primaryContent: '#382207',
    baseBackground: '#fffcf8',
    baseContent: '#0d0d17',
    frameRadius: 14,
  }
}
