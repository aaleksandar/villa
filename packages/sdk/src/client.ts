/**
 * Villa SDK Client
 *
 * Main SDK class providing identity, ENS, and avatar functionality.
 */

import type { AvatarConfig, VillaConfig, Identity } from './types'
import { resolveEns as resolveEnsName, reverseEns as reverseEnsAddress } from './ens'
import { getAvatarUrl as generateAvatarUrl } from './avatar'
import {
  signIn as authSignIn,
  signOut as authSignOut,
  isAuthenticated as checkAuth,
  getIdentity as getCurrentIdentity,
  type AuthOptions,
} from './auth'

/**
 * Villa SDK Client
 *
 * Provides identity resolution, ENS lookups, and avatar generation.
 *
 * @example
 * const villa = new Villa({ appId: 'my-app' })
 *
 * // Resolve ENS name
 * const address = await villa.resolveEns('vitalik.eth')
 *
 * // Reverse lookup
 * const name = await villa.reverseEns('0xd8dA...')
 *
 * // Generate avatar
 * const url = villa.getAvatarUrl('alice', { style: 'bottts' })
 */
export class Villa {
  private config: VillaConfig

  constructor(config: VillaConfig) {
    this.config = {
      ...config,
      network: config.network || 'base',
      apiUrl: config.apiUrl || 'https://api.villa.cash',
    }
  }

  /**
   * Resolves an ENS name to an Ethereum address
   *
   * @param name - ENS name (e.g., 'vitalik.eth' or 'alice.base.eth')
   * @returns Address or null if not found
   */
  async resolveEns(name: string): Promise<string | null> {
    return resolveEnsName(name)
  }

  /**
   * Performs reverse ENS lookup (address to name)
   *
   * @param address - Ethereum address
   * @returns ENS name or null if not found
   */
  async reverseEns(address: string): Promise<string | null> {
    return reverseEnsAddress(address)
  }

  /**
   * Generates a deterministic avatar URL
   *
   * @param seed - Seed for deterministic generation (address, nickname, etc)
   * @param config - Optional avatar configuration
   * @returns URL to DiceBear SVG avatar
   */
  getAvatarUrl(seed: string, config?: Partial<AvatarConfig>): string {
    return generateAvatarUrl(seed, config)
  }

  /**
   * Gets the current network configuration
   */
  getNetwork(): 'base' | 'base-sepolia' {
    return this.config.network || 'base'
  }

  /**
   * Gets the API URL
   */
  getApiUrl(): string {
    return this.config.apiUrl || 'https://api.villa.cash'
  }

  /**
   * Signs in a user via Porto passkey flow
   *
   * Creates fullscreen iframe, waits for auth completion.
   *
   * @param options - Auth flow callbacks
   * @returns Promise resolving to user identity
   *
   * @example
   * const identity = await villa.signIn({
   *   onSuccess: (identity) => console.log('Signed in:', identity),
   *   onError: (error) => console.error('Sign in failed:', error)
   * })
   */
  async signIn(options?: AuthOptions): Promise<Identity> {
    return authSignIn(options)
  }

  /**
   * Signs out the current user
   *
   * Clears session from localStorage and memory.
   *
   * @example
   * await villa.signOut()
   */
  async signOut(): Promise<void> {
    return authSignOut()
  }

  /**
   * Checks if user is currently authenticated
   *
   * @returns true if user has valid session
   *
   * @example
   * if (villa.isAuthenticated()) {
   *   console.log('User is signed in')
   * }
   */
  isAuthenticated(): boolean {
    return checkAuth()
  }

  /**
   * Gets the current user's identity
   *
   * @returns Identity if authenticated, null otherwise
   *
   * @example
   * const identity = villa.getIdentity()
   * if (identity) {
   *   console.log('Current user:', identity.nickname)
   * }
   */
  getIdentity(): Identity | null {
    return getCurrentIdentity()
  }
}
