'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { Identity, VillaConfig } from '@rockfridrich/villa-sdk'

/**
 * Auth result from Villa authentication
 */
export interface VillaAuthResult {
  success: true
  identity: Identity
}

export interface VillaAuthError {
  success: false
  error: string
  code: 'CANCELLED' | 'AUTH_FAILED' | 'NETWORK_ERROR' | 'TIMEOUT'
}

export type VillaAuthResponse = VillaAuthResult | VillaAuthError

interface VillaContextValue {
  /** Current authenticated identity */
  identity: Identity | null
  /** Whether auth is in progress */
  isLoading: boolean
  /** Whether user is authenticated */
  isAuthenticated: boolean
  /** Start sign in flow */
  signIn: () => Promise<VillaAuthResponse>
  /** Sign out and clear identity */
  signOut: () => void
  /** SDK configuration */
  config: VillaConfig
}

const VillaContext = createContext<VillaContextValue | null>(null)

const STORAGE_KEY = 'villa-identity'
const AUTH_URL = 'https://villa.cash/auth'

interface VillaProviderProps {
  children: ReactNode
  config: VillaConfig
}

/**
 * Villa Provider - Wrap your app with this to enable authentication
 *
 * @example
 * ```tsx
 * <VillaProvider config={{ appId: 'your-app' }}>
 *   <App />
 * </VillaProvider>
 * ```
 */
export function VillaProvider({ children, config }: VillaProviderProps) {
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load stored identity on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setIdentity(JSON.parse(stored))
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  const signIn = useCallback(async (): Promise<VillaAuthResponse> => {
    setIsLoading(true)

    return new Promise((resolve) => {
      // Create iframe for auth
      const iframe = document.createElement('iframe')
      const params = new URLSearchParams({
        appId: config.appId,
        network: config.network || 'base',
        origin: window.location.origin,
      })

      iframe.src = `${AUTH_URL}?${params}`
      iframe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
        z-index: 99999;
        background: white;
      `

      // Listen for auth result
      const handleMessage = (event: MessageEvent) => {
        // Validate origin
        if (!event.origin.includes('villa.cash')) return

        const { type, payload } = event.data || {}

        if (type === 'VILLA_AUTH_SUCCESS') {
          const newIdentity: Identity = payload.identity
          setIdentity(newIdentity)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdentity))
          cleanup()
          resolve({ success: true, identity: newIdentity })
        }

        if (type === 'VILLA_AUTH_ERROR') {
          cleanup()
          resolve({
            success: false,
            error: payload.error || 'Authentication failed',
            code: payload.code || 'AUTH_FAILED',
          })
        }

        if (type === 'VILLA_AUTH_CANCEL') {
          cleanup()
          resolve({
            success: false,
            error: 'Authentication cancelled',
            code: 'CANCELLED',
          })
        }
      }

      const cleanup = () => {
        window.removeEventListener('message', handleMessage)
        iframe.remove()
        setIsLoading(false)
      }

      window.addEventListener('message', handleMessage)
      document.body.appendChild(iframe)

      // Timeout after 5 minutes
      setTimeout(() => {
        cleanup()
        resolve({
          success: false,
          error: 'Authentication timed out',
          code: 'TIMEOUT',
        })
      }, 5 * 60 * 1000)
    })
  }, [config])

  const signOut = useCallback(() => {
    setIdentity(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value: VillaContextValue = {
    identity,
    isLoading,
    isAuthenticated: !!identity,
    signIn,
    signOut,
    config,
  }

  return <VillaContext.Provider value={value}>{children}</VillaContext.Provider>
}

/**
 * Hook to access Villa context
 * Must be used within VillaProvider
 */
export function useVillaContext(): VillaContextValue {
  const context = useContext(VillaContext)
  if (!context) {
    throw new Error('useVillaContext must be used within a VillaProvider')
  }
  return context
}
