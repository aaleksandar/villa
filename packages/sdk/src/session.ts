/**
 * Session Management
 *
 * Handles localStorage persistence for authenticated sessions.
 */

import type { VillaSession } from './types'

const SESSION_KEY = 'villa_session'

/**
 * Saves a session to localStorage
 */
export function saveSession(session: VillaSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch (error) {
    console.error('[Villa SDK] Failed to save session:', error)
  }
}

/**
 * Loads session from localStorage
 *
 * @returns Session if found and valid, null otherwise
 */
export function loadSession(): VillaSession | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return null

    const session = JSON.parse(stored) as VillaSession

    // Check if session is still valid
    if (!isSessionValid(session)) {
      clearSession()
      return null
    }

    return session
  } catch (error) {
    console.error('[Villa SDK] Failed to load session:', error)
    return null
  }
}

/**
 * Clears the session from localStorage
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.error('[Villa SDK] Failed to clear session:', error)
  }
}

/**
 * Checks if a session is still valid
 *
 * @param session - Session to validate
 * @returns true if session is valid and not expired
 */
export function isSessionValid(session: VillaSession): boolean {
  if (!session || !session.identity || !session.expiresAt) {
    return false
  }

  // Check if session has expired
  const now = Date.now()
  return session.expiresAt > now
}
