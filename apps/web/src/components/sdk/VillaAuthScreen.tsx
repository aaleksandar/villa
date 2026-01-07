'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { setWebAuthnHandlers, createAccountHeadless, signInHeadless } from '@/lib/porto'
import { PasskeyPrompt } from './PasskeyPrompt'

export interface VillaAuthScreenProps {
  /** Callback when authentication succeeds */
  onSuccess?: (address: string) => void
  /** Callback when user cancels */
  onCancel?: () => void
  /** Optional custom logo component */
  logo?: React.ReactNode
}

/**
 * VillaAuthScreen - Full-screen authentication UI using Porto relay mode
 *
 * Replaces Porto's default popup with Villa-branded full-screen experience.
 * Uses relay mode to intercept WebAuthn calls and show PasskeyPrompt.
 */
export function VillaAuthScreen({
  onSuccess,
  onCancel: _onCancel,
  logo,
}: VillaAuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'signin' | 'create' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [passkeyMode, setPasskeyMode] = useState<'idle' | 'create' | 'authenticate'>('idle')

  const shouldReduceMotion = useReducedMotion()

  // Check for reduced motion preference
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ).current

  const springConfig = { type: "spring", stiffness: 300, damping: 40 } as const

  const containerVariants = shouldReduceMotion ? undefined : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.1 },
    },
  }

  const itemVariants = shouldReduceMotion ? undefined : {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  // Set up WebAuthn handlers on mount
  useEffect(() => {
    setWebAuthnHandlers({
      onPasskeyCreate: async () => {
        setPasskeyMode('create')
      },
      onPasskeyGet: async () => {
        setPasskeyMode('authenticate')
      },
      onComplete: (result) => {
        setPasskeyMode('idle')
        setIsLoading(false)
        setLoadingAction(null)
        onSuccess?.(result.address)
      },
      onError: (error) => {
        setPasskeyMode('idle')
        setIsLoading(false)
        setLoadingAction(null)
        setError(error.message)
      },
    })

    return () => {
      // Clean up handlers on unmount
      setWebAuthnHandlers({})
    }
  }, [onSuccess])

  const handleSignIn = async () => {
    setError(null)
    setIsLoading(true)
    setLoadingAction('signin')

    const result = await signInHeadless()

    if (!result.success) {
      setError(result.error.message)
      setIsLoading(false)
      setLoadingAction(null)
    }
    // Success is handled by onComplete handler
  }

  const handleCreateAccount = async () => {
    setError(null)
    setIsLoading(true)
    setLoadingAction('create')

    const result = await createAccountHeadless()

    if (!result.success) {
      setError(result.error.message)
      setIsLoading(false)
      setLoadingAction(null)
    }
    // Success is handled by onComplete handler
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col min-h-[100dvh] justify-between p-6 bg-cream-50"
      >
        {/* Top: Logo */}
        <motion.div variants={itemVariants} className="pt-20">
          {logo || (
            <div className="text-center">
              <h1 className="text-2xl font-serif text-ink">Villa</h1>
            </div>
          )}
        </motion.div>

        {/* Center: Content */}
        <div className="w-full max-w-sm mx-auto space-y-8">
          {/* Headline */}
          <motion.div variants={itemVariants} className="text-center space-y-2">
            <h1 className="text-3xl font-serif text-ink">
              Your identity.{' '}
              <span className="bg-gradient-to-r from-accent-yellow to-accent-green bg-clip-text text-transparent">
                No passwords.
              </span>
            </h1>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-error-text bg-error-bg border border-error-border p-3 rounded-md"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div variants={itemVariants} className="space-y-4">
            {/* Primary: Sign In */}
            <motion.button
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              transition={springConfig}
              onClick={handleSignIn}
              disabled={isLoading}
              aria-label="Sign in with passkey"
              className="w-full min-h-14 px-6 py-3 text-base font-medium
                         bg-gradient-to-br from-accent-yellow via-villa-500 to-accent-yellow
                         hover:from-villa-600 hover:to-villa-700
                         text-accent-brown rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-150"
            >
              {isLoading && loadingAction === 'signin' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </motion.button>

            {/* Secondary: Create Villa ID */}
            <motion.button
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              transition={springConfig}
              onClick={handleCreateAccount}
              disabled={isLoading}
              aria-label="Create new Villa ID"
              className="w-full min-h-14 px-6 py-3 text-base font-medium
                         bg-cream-100 hover:bg-cream-200
                         text-ink border border-neutral-100 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-150"
            >
              {isLoading && loadingAction === 'create' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Villa ID'
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Bottom: Trust Badge */}
        <motion.div
          variants={itemVariants}
          className="pb-8 flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-accent-green" />
          <span className="text-sm text-ink-muted">Secured by passkeys</span>
        </motion.div>
      </motion.div>

      {/* PasskeyPrompt overlay - shows during WebAuthn ceremony */}
      <AnimatePresence>
        {passkeyMode !== 'idle' && (
          <PasskeyPrompt mode={passkeyMode} />
        )}
      </AnimatePresence>
    </>
  )
}
