'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Shuffle } from 'lucide-react'
import { Button } from '@/components/ui'
import { AvatarPreview } from './AvatarPreview'
import { createAvatarConfig } from '@/lib/avatar'
import type { AvatarStyleSelection, AvatarConfig } from '@/types'

interface AvatarSelectionProps {
  /** Wallet address for avatar generation */
  walletAddress: string
  /** Callback when avatar is selected */
  onSelect: (config: AvatarConfig) => void
  /** Timer duration in seconds (default 30) */
  timerDuration?: number
}

const STYLE_OPTIONS: { value: AvatarStyleSelection; label: string }[] = [
  { value: 'adventurer', label: 'Adventurer' },
  { value: 'avataaars', label: 'Avataaars' },
  { value: 'bottts', label: 'Bottts' },
  { value: 'lorelei', label: 'Lorelei' },
  { value: 'notionists', label: 'Notionists' },
  { value: 'thumbs', label: 'Thumbs' },
]

/**
 * Avatar selection component with timer
 * Per product spec: 30-second countdown, auto-select at 0
 */
export function AvatarSelection({
  walletAddress,
  onSelect,
  timerDuration = 30,
}: AvatarSelectionProps) {
  const [selection, setSelection] = useState<AvatarStyleSelection>('lorelei')
  const [variant, setVariant] = useState(0)
  const [timer, setTimer] = useState(timerDuration)
  const [isSelecting, setIsSelecting] = useState(false)

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isMounted.current) return

      setTimer((t) => {
        if (t <= 1) {
          // Auto-select when timer reaches 0
          handleSelect()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback(() => {
    if (isSelecting) return
    setIsSelecting(true)

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    const config = createAvatarConfig(selection, variant)
    onSelect(config)
  }, [selection, variant, onSelect, isSelecting])

  const handleRandomize = () => {
    setVariant((v) => v + 1)
  }

  const handleStyleChange = (newSelection: AvatarStyleSelection) => {
    setSelection(newSelection)
    // Reset variant when changing style for fresh look
    setVariant(0)
  }

  // Timer styling based on remaining time
  const timerColor = timer <= 5 ? 'text-red-500' : timer <= 10 ? 'text-amber-500' : 'text-ink-muted'
  const timerPulse = timer <= 5 ? 'animate-pulse' : ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif text-ink">Pick your look</h2>
        <p className="text-ink-muted text-sm">
          Choose a style that represents you
        </p>
      </div>

      {/* Style selector - 3x2 grid */}
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        {STYLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleStyleChange(option.value)}
            disabled={isSelecting}
            className={`
              flex flex-col items-center gap-2 p-3 rounded-lg transition-all
              ${selection === option.value
                ? 'bg-accent-yellow border-2 border-accent-brown'
                : 'bg-cream-100 border-2 border-transparent hover:border-cream-300'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-cream-200">
              <AvatarPreview
                walletAddress={walletAddress}
                selection={option.value}
                variant={0}
                size={48}
              />
            </div>
            <span className="text-xs font-medium text-ink">
              {option.label}
            </span>
          </button>
        ))}
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center">
        <div className="relative">
          <AvatarPreview
            walletAddress={walletAddress}
            selection={selection}
            variant={variant}
            size={160}
            className="shadow-lg"
          />
        </div>
      </div>

      {/* Randomize and timer row */}
      <div className="flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRandomize}
          disabled={isSelecting}
          className="text-ink-muted hover:text-ink"
        >
          <Shuffle className="w-4 h-4 mr-2" />
          Randomize
        </Button>

        <span className={`font-mono text-lg ${timerColor} ${timerPulse}`}>
          0:{timer.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Select button */}
      <Button
        size="lg"
        className="w-full"
        onClick={() => handleSelect()}
        disabled={isSelecting}
      >
        {isSelecting ? 'Saving...' : 'Select'}
      </Button>

      {/* Helper text */}
      <p className="text-center text-xs text-ink-muted">
        {timer > 0
          ? 'Take your time, or let the timer choose for you'
          : 'Avatar selected!'}
      </p>
    </div>
  )
}
