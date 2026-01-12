'use client'

import { useState, useEffect } from 'react'
import { useIdentity, useAuth, Avatar, VillaAuth } from '@rockfridrich/villa-sdk-react'
import type { VillaAuthResponse, Identity } from '@rockfridrich/villa-sdk-react'

// Avatar config type matching SDK
interface AvatarConfig {
  style: string
  seed: string
  gender?: 'male' | 'female' | 'other'
}

// Resident entry in the directory
interface Resident {
  address: string
  nickname: string
  avatar: AvatarConfig
  joinedAt: number
}

// Storage key for residents
const RESIDENTS_KEY = 'proof-of-retreat-residents'

// Load residents from localStorage
function loadResidents(): Resident[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(RESIDENTS_KEY)
  return stored ? JSON.parse(stored) : []
}

// Save residents to localStorage
function saveResidents(residents: Resident[]) {
  localStorage.setItem(RESIDENTS_KEY, JSON.stringify(residents))
}

export default function HomePage() {
  const identity = useIdentity()
  const { signOut, isLoading } = useAuth()
  const [residents, setResidents] = useState<Resident[]>([])
  const [hasJoined, setHasJoined] = useState(false)

  // Load residents on mount
  useEffect(() => {
    setResidents(loadResidents())
  }, [])

  // Check if current user has joined
  useEffect(() => {
    if (identity) {
      const joined = residents.some(r => r.address === identity.address)
      setHasJoined(joined)
    }
  }, [identity, residents])

  const handleAuthComplete = (result: VillaAuthResponse) => {
    if (result.success) {
      console.log('Successfully authenticated:', result.identity)
    } else {
      console.error('Authentication failed:', result.error)
    }
  }

  const handleJoinDirectory = () => {
    if (!identity || !identity.nickname) return

    const newResident: Resident = {
      address: identity.address,
      nickname: identity.nickname,
      avatar: identity.avatar || { seed: identity.address, style: 'lorelei' },
      joinedAt: Date.now()
    }

    const updated = [...residents.filter(r => r.address !== identity.address), newResident]
    setResidents(updated)
    saveResidents(updated)
    setHasJoined(true)
  }

  const handleLeaveDirectory = () => {
    if (!identity) return

    const updated = residents.filter(r => r.address !== identity.address)
    setResidents(updated)
    saveResidents(updated)
    setHasJoined(false)
  }

  if (isLoading) {
    return (
      <main className="container">
        <div className="card">
          <p>Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container">
      {/* Header */}
      <header className="header">
        <h1>Proof of Retreat</h1>
        <p className="subtitle">Resident Directory</p>
      </header>

      {/* Auth Section */}
      {!identity ? (
        <div className="card">
          <h2>Join the Community</h2>
          <p className="help-text">
            Sign in with your Villa ID to view and join the resident directory.
          </p>
          <VillaAuth onComplete={handleAuthComplete} />
        </div>
      ) : (
        <div className="card">
          <div className="profile">
            <Avatar identity={identity} size={64} />
            <div className="profile-info">
              <p className="nickname">@{identity.nickname || 'anonymous'}</p>
              <p className="address">{identity.address.slice(0, 6)}...{identity.address.slice(-4)}</p>
            </div>
          </div>
          <div className="actions">
            {!hasJoined ? (
              <button
                onClick={handleJoinDirectory}
                className="primary-button"
                disabled={!identity.nickname}
                title={!identity.nickname ? 'Set a nickname first' : undefined}
              >
                {identity.nickname ? 'Join Directory' : 'Set Nickname First'}
              </button>
            ) : (
              <button onClick={handleLeaveDirectory} className="secondary-button">
                Leave Directory
              </button>
            )}
            <button onClick={signOut} className="sign-out-button">
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Residents Directory */}
      <div className="card">
        <h2>Residents ({residents.length})</h2>
        {residents.length === 0 ? (
          <p className="empty-state">No residents yet. Be the first to join!</p>
        ) : (
          <div className="residents-grid">
            {residents.map((resident) => (
              <div key={resident.address} className="resident-card">
                <Avatar
                  identity={{
                    address: resident.address as `0x${string}`,
                    nickname: resident.nickname,
                    avatar: resident.avatar
                  }}
                  size={48}
                />
                <span className="resident-nickname">@{resident.nickname}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
