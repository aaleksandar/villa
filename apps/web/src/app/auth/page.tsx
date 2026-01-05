'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useMemo, Suspense } from 'react'
import { VillaAuth, type VillaAuthResponse } from '@/components/sdk'

/**
 * Auth Page - SDK iframe target
 *
 * This page is loaded inside an iframe by the Villa SDK.
 * It handles the full auth flow and communicates back to the parent via postMessage.
 *
 * Query params:
 * - scopes: comma-separated list of requested scopes (e.g., "profile,wallet")
 * - appId: the integrating app's ID
 * - origin: (optional) parent origin for secure postMessage targeting
 */

// Trusted origins that can embed this page and receive postMessages
const TRUSTED_ORIGINS = [
  'https://villa.cash',
  'https://www.villa.cash',
  'https://beta.villa.cash',
  'https://dev-1.villa.cash',
  'https://dev-2.villa.cash',
  'https://developers.villa.cash',
  'https://localhost:3000',
  'https://localhost:3001',
] as const

function isInIframe(): boolean {
  try {
    return window.self !== window.top
  } catch {
    return true // Blocked access means we're in an iframe
  }
}

/**
 * Get validated parent origin for secure postMessage
 * Returns the origin if trusted, null otherwise
 */
function getValidatedParentOrigin(queryOrigin: string | null): string | null {
  // 1. Try query param origin (SDK passes this)
  if (queryOrigin && TRUSTED_ORIGINS.includes(queryOrigin as typeof TRUSTED_ORIGINS[number])) {
    return queryOrigin
  }

  // 2. Try document.referrer
  if (typeof document !== 'undefined' && document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer)
      const referrerOrigin = referrerUrl.origin
      if (TRUSTED_ORIGINS.includes(referrerOrigin as typeof TRUSTED_ORIGINS[number])) {
        return referrerOrigin
      }
    } catch {
      // Invalid referrer URL
    }
  }

  // 3. In development, allow localhost
  if (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '*' // Allow wildcard only in local development
  }

  return null
}

function AuthPageContent() {
  const searchParams = useSearchParams()
  const hasNotifiedReady = useRef(false)

  // Parse query params
  const appId = searchParams.get('appId') || 'Villa'
  const queryOrigin = searchParams.get('origin')

  // Get validated parent origin once
  const targetOrigin = useMemo(() => {
    return getValidatedParentOrigin(queryOrigin)
  }, [queryOrigin])

  // Post message to parent window with validated origin
  const postToParent = useCallback((message: Record<string, unknown>) => {
    if (!isInIframe()) {
      console.log('[Villa Auth] Not in iframe, message:', message)
      return
    }

    if (!targetOrigin) {
      console.warn('[Villa Auth] No trusted origin found, message not sent:', message)
      return
    }

    // Post to validated parent origin only
    window.parent.postMessage(message, targetOrigin)
  }, [targetOrigin])

  // Notify parent that auth is ready
  useEffect(() => {
    if (!hasNotifiedReady.current) {
      hasNotifiedReady.current = true
      postToParent({ type: 'VILLA_AUTH_READY' })
    }
  }, [postToParent])

  // Handle auth completion
  const handleComplete = useCallback((result: VillaAuthResponse) => {
    if (result.success) {
      // Map web app's AvatarConfig to SDK's Identity avatar format
      // Web: { style, selection, variant }
      // SDK: { style, seed, gender }
      const avatarConfig = result.identity.avatar
      const seed = `${result.identity.address}-${avatarConfig.variant}`

      const identity = {
        address: result.identity.address,
        nickname: result.identity.nickname,
        avatar: {
          style: avatarConfig.style,
          seed,
          gender: avatarConfig.selection,
        },
      }

      // Send both legacy and new message formats for compatibility
      postToParent({ type: 'AUTH_SUCCESS', identity })
      postToParent({ type: 'VILLA_AUTH_SUCCESS', identity })
    } else {
      if (result.code === 'CANCELLED') {
        postToParent({ type: 'AUTH_CLOSE' })
        postToParent({ type: 'VILLA_AUTH_CANCEL' })
      } else {
        postToParent({ type: 'AUTH_ERROR', error: result.error })
        postToParent({ type: 'VILLA_AUTH_ERROR', error: result.error, code: result.code })
      }
    }
  }, [postToParent])

  return (
    <VillaAuth
      onComplete={handleComplete}
      appName={appId}
    />
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-ink-muted">Loading...</p>
        </div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
}
