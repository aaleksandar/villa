/**
 * @villa/sdk - Villa Identity SDK
 *
 * Privacy-first identity SDK for pop-up villages.
 * Wraps Porto passkey authentication with Villa theming.
 *
 * Network: Base (primary), Base Sepolia (testnet)
 */

// Main SDK client
export { Villa } from './client'

// Core utilities
export { resolveEns, reverseEns } from './ens'
export { getAvatarUrl, createAvatarConfig } from './avatar'

// Auth utilities
export { signIn, signOut, isAuthenticated, getIdentity } from './auth'
export type { AuthOptions } from './auth'

// Session utilities
export { saveSession, loadSession, clearSession } from './session'

// Iframe utilities (advanced usage)
export { createAuthIframe, destroyAuthIframe } from './iframe'
export type { IframeConfig, AuthMessage } from './iframe'

// Types - all shared types for the ecosystem
export type {
  Identity,
  AvatarConfig,
  Profile,
  NicknameCheckResult,
  VillaConfig,
  VillaSession,
  Result,
} from './types'
