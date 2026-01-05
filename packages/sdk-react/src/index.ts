/**
 * @rockfridrich/villa-sdk-react
 *
 * React bindings for Villa SDK
 * Privacy-first passkey authentication for Base network
 */

// Context & Provider
export { VillaProvider, useVillaContext } from './context'
export type { VillaAuthResult, VillaAuthError, VillaAuthResponse } from './context'

// Hooks
export { useIdentity, useAuth, useVillaConfig } from './hooks'

// Components
export { VillaAuth, Avatar, AvatarPreview } from './components'

// Re-export types from core SDK
export type {
  Identity,
  AvatarConfig,
  VillaConfig,
  SignInResult,
  SignInErrorCode,
} from '@rockfridrich/villa-sdk'
