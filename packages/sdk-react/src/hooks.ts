'use client'

import { useVillaContext } from './context'
import type { Identity } from '@rockfridrich/villa-sdk'

/**
 * Hook to get current authenticated identity
 *
 * @example
 * ```tsx
 * function Profile() {
 *   const identity = useIdentity()
 *   if (!identity) return <p>Not logged in</p>
 *   return <p>Welcome, @{identity.nickname}</p>
 * }
 * ```
 */
export function useIdentity(): Identity | null {
  const { identity } = useVillaContext()
  return identity
}

/**
 * Hook for auth state and methods
 *
 * @example
 * ```tsx
 * function LoginButton() {
 *   const { signIn, signOut, isAuthenticated, isLoading } = useAuth()
 *
 *   if (isLoading) return <p>Loading...</p>
 *
 *   return isAuthenticated
 *     ? <button onClick={signOut}>Sign Out</button>
 *     : <button onClick={signIn}>Sign In</button>
 * }
 * ```
 */
export function useAuth() {
  const { signIn, signOut, isAuthenticated, isLoading } = useVillaContext()
  return { signIn, signOut, isAuthenticated, isLoading }
}

/**
 * Hook to access Villa SDK configuration
 */
export function useVillaConfig() {
  const { config } = useVillaContext()
  return config
}
