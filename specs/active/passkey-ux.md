# Passkey UX Specification

**Status:** Active
**Owner:** @build
**Updated:** 2026-01-10

Privacy-first passkey authentication UX for Villa. Defines user flows, error handling, accessibility, and testing strategy across dialog and relay modes.

---

## Context

Villa uses Porto SDK for passkey management with two distinct modes:

- **Dialog Mode** (primary): Porto shows iframe dialog, 1Password and passkey managers can intercept
- **Relay Mode** (SDK iframe only): Villa controls UI fully, but breaks password manager integrations

See [LEARNINGS.md Pattern 50](/Users/me/Documents/Coding/villa/.claude/LEARNINGS.md#50-porto-mode-selection-pattern-critical---2026-01-08-updated-2026-01-10) for mode selection rationale.

---

## User Flows

### Flow 1: Sign In (Returning User)

```
┌─────────────────────────────┐
│   VillaAuth Welcome Screen  │
│                             │
│  "Your identity.            │
│   No passwords."            │
│                             │
│  [Sign In] ← Primary CTA    │
│  [Create Villa ID]          │
└─────────────────────────────┘
              ↓ (tap Sign In)
┌─────────────────────────────┐
│   Browser Passkey Selector  │ ← Dialog mode (Porto iframe)
│                             │
│  • iPhone (Touch ID)        │ ← 1Password intercepts here
│  • MacBook (Touch ID)       │
│  • Security Key             │
│                             │
│  [Cancel] [Use Selected]    │
└─────────────────────────────┘
              ↓ (biometric success)
┌─────────────────────────────┐
│   App Authenticated State   │
│                             │
│  Welcome back!              │
│  Address: 0x1234...5678     │
└─────────────────────────────┘
```

**Key States:**
- Idle (buttons visible)
- Loading (spinner on button, "Signing in...")
- Browser prompt (native OS dialog, Porto manages)
- Success (transition to app)
- Error (inline message, buttons re-enabled)

**Timing:**
- Button press → Porto dialog: <200ms
- Biometric → success callback: ~1-2s (OS-controlled)
- Success → app transition: <300ms

---

### Flow 2: Create Villa ID (New User)

```
┌─────────────────────────────┐
│   VillaAuth Welcome Screen  │
│                             │
│  [Sign In]                  │
│  [Create Villa ID] ← Tap    │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│   Browser Passkey Creation  │ ← Dialog mode (Porto iframe)
│                             │
│  "Create a passkey for      │
│   villa.cash"               │
│                             │
│  Save to:                   │
│  • iCloud Keychain          │ ← 1Password can inject option
│  • 1Password                │
│  • This Device              │
│                             │
│  [Cancel] [Continue]        │
└─────────────────────────────┘
              ↓ (select option)
┌─────────────────────────────┐
│   Biometric Prompt          │ ← OS-level (Face ID/Touch ID)
│                             │
│  "Confirm with Face ID"     │
│  [illustration of face]     │
└─────────────────────────────┘
              ↓ (success)
┌─────────────────────────────┐
│   App Onboarding            │
│                             │
│  Villa ID created!          │
│  Address: 0x1234...5678     │
└─────────────────────────────┘
```

**First-time User Considerations:**
- Show "Why passkeys?" education (collapsible)
- Display provider logos (1Password, iCloud, Google, Windows Hello)
- Trust badge: "Secured by passkeys on Base"

---

### Flow 3: Error Recovery

```
User taps "Sign In"
    ↓
Porto dialog opens
    ↓
User cancels passkey prompt
    ↓
┌─────────────────────────────┐
│   VillaAuth (error cleared) │
│                             │
│  [Sign In] ← Re-enabled     │
│  [Create Villa ID]          │
└─────────────────────────────┘
```

**No error message shown for cancellation** (intentional user action).

```
User taps "Sign In"
    ↓
Porto dialog opens
    ↓
No passkey found (InvalidStateError)
    ↓
┌─────────────────────────────┐
│   VillaAuth (error state)   │
│                             │
│  ⚠ No passkey found.        │ ← Error banner
│    Create a Villa ID first. │
│                             │
│  [Sign In]                  │
│  [Create Villa ID] ← Focus  │
└─────────────────────────────┘
```

**Error recovery path:** Guide user to correct action (create vs sign in).

---

## Screen Wireframes (Text-Based)

### Welcome Screen (Dialog Mode)

```
┌──────────────────────────────────────────┐
│                  [Logo]                   │ ← pt-20, centered
│                                           │
│                                           │
│     Your identity. No passwords.          │ ← H1, serif, 3xl
│                                           │
│   Sign in with your fingerprint, face,   │ ← Body, sm, muted
│          or security key                  │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │ ℹ️  Why passkeys?  [v]              │ ← Collapsible education
│  └────────────────────────────────────┘  │
│                                           │
│  ⚠ [Error message here if needed]        │ ← Conditional, red bg
│                                           │
│  ┌────────────────────────────────────┐  │
│  │         Sign In                    │ ← Primary button (gradient)
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │      Create Villa ID               │ ← Secondary button (cream)
│  └────────────────────────────────────┘  │
│                                           │
│   Works with your passkey manager        │ ← Caption
│  [1P] [iCloud] [Google]                  │ ← Provider grid
│  [Windows] [Browser] [FIDO2]             │
│                                           │
│                                           │
│  🛡️  Secured by passkeys on Base         │ ← Trust badge, bottom
└──────────────────────────────────────────┘
```

**Responsive:**
- Mobile: Full screen, max-w-sm, p-6
- Desktop: Centered card, same layout
- Motion-reduced: Skip animations

---

### PasskeyPrompt Overlay (Relay Mode Only)

```
┌──────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← Backdrop blur
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░┌────────────────────────┐░░░░░░░░░│
│░░░░░░│                         │░░░░░░░░░│
│░░░░░░│      [Animated Icon]    │░░░░░░░░░│ ← Fingerprint or Scan
│░░░░░░│                         │░░░░░░░░░│
│░░░░░░│   Creating your Villa ID│░░░░░░░░░│ ← H2, serif
│░░░░░░│                         │░░░░░░░░░│
│░░░░░░│ Use your fingerprint or │░░░░░░░░░│ ← Body, sm
│░░░░░░│    face to secure your  │░░░░░░░░░│
│░░░░░░│        account          │░░░░░░░░░│
│░░░░░░│                         │░░░░░░░░░│
│░░░░░░│        • • •            │░░░░░░░░░│ ← Pulsing dots
│░░░░░░│                         │░░░░░░░░░│
│░░░░░░└────────────────────────┘░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└──────────────────────────────────────────┘
```

**Only shown in relay mode** (SDK iframe). Dialog mode uses native Porto iframe.

---

## Error Handling Matrix

Comprehensive WebAuthn error mapping with user-friendly messaging.

| Error Code | Error Type | Title | Message | Action Button | User Intent |
|------------|-----------|-------|---------|---------------|-------------|
| `NotAllowedError` | User cancelled | (no title) | (no message) | Re-enable buttons | Intentional cancel |
| `InvalidStateError` (sign in) | No passkey exists | No passkey found | You don't have a Villa ID yet. Create one to get started. | Focus "Create Villa ID" | Guide to creation |
| `InvalidStateError` (create) | Passkey exists | Already have Villa ID | You already have a Villa ID. Use Sign In instead. | Focus "Sign In" | Guide to sign in |
| `NotSupportedError` | Browser unsupported | Passkeys not supported | Your browser doesn't support passkeys. Try Chrome, Safari, or Edge. | Show help link | Browser upgrade |
| `SecurityError` | HTTPS required | Secure connection required | Passkeys require HTTPS. Visit https://villa.cash instead. | Copy HTTPS URL | Protocol fix |
| `TimeoutError` | Request timed out | Request timed out | The passkey request timed out. Please try again. | Retry button | Retry action |
| `NetworkError` | Network issue | Connection problem | Check your internet connection and try again. | Retry button | Network fix |
| `UnknownError` | Fallback | Something went wrong | An unexpected error occurred. Please try again or contact support. | Retry + support link | Escalation |

**Error Display Pattern:**

```typescript
// Error banner (VillaAuthDialog/Screen, lines 197-208)
{error && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-2 text-error-text bg-error-bg border border-error-border p-3 rounded-lg"
    role="alert"
    aria-live="polite"
  >
    <AlertCircle className="w-4 h-4 flex-shrink-0" />
    <span className="text-sm">{error}</span>
  </motion.div>
)}
```

**Error State Management:**

```typescript
// Clear error on new attempt (VillaAuthDialog, line 63)
const handleSignIn = async () => {
  setError(null)  // ← Clear previous error
  setIsLoading(true)

  const result = await signInDialog()

  setIsLoading(false)

  if (result.success) {
    onSuccess?.(result.address)
  } else {
    const errorMsg = result.error?.message || 'Sign in failed'
    // Don't show error for user cancellation
    if (!errorMsg.includes('cancelled') && !errorMsg.includes('aborted')) {
      setError(errorMsg)
    }
  }
}
```

---

## Password Manager Messaging

### Dialog Mode (Recommended)

**1Password Integration:**
- Porto's iframe dialog provides user gesture context
- 1Password content scripts inject into iframe
- User sees 1Password option in passkey picker
- No custom messaging needed (OS + 1Password handle UX)

**Villa UI Shows:**
```
Works with your passkey manager
[1Password logo] [iCloud logo] [Google logo]
```

**Why it works:**
- Porto dialog = iframe with user gesture
- Iframe context lets 1Password intercept WebAuthn
- See LEARNINGS.md Pattern 50 for details

---

### Relay Mode (SDK Iframe Only)

**1Password DOES NOT Work:**
- Villa calls `navigator.credentials.*` directly
- 1Password cannot intercept (no Porto dialog context)
- Users must use device-level passkey managers (iCloud, Google, Windows Hello)

**Villa UI Shows:**
```
Works with your device biometric
[iCloud logo] [Google logo] [Windows logo]
```

**No 1Password logo displayed** in relay mode UI.

**Warning Comment in Code:**
```typescript
/**
 * VillaAuthScreen - Full-screen authentication UI using Porto relay mode
 *
 * WARNING: This component uses relay mode which breaks 1Password and passkey
 * ecosystem integrations. Use VillaAuth.tsx for main onboarding flows.
 */
```

---

## Accessibility Requirements

### ARIA Labels

```typescript
// Primary button (VillaAuthDialog, line 218)
<button
  onClick={handleSignIn}
  disabled={isLoading}
  aria-label="Sign in with existing passkey"  // ← Descriptive label
  className="..."
>
  {isLoading ? 'Signing in...' : 'Sign In'}
</button>

// Secondary button (line 243)
<button
  onClick={handleCreateAccount}
  disabled={isLoading}
  aria-label="Create new Villa ID with passkey"  // ← Descriptive label
  className="..."
>
  {isLoading ? 'Creating...' : 'Create Villa ID'}
</button>
```

### Focus Management

**Error State:**
```typescript
// After InvalidStateError on sign in → focus "Create Villa ID" button
// After InvalidStateError on create → focus "Sign In" button

// Implementation:
const createButtonRef = useRef<HTMLButtonElement>(null)
const signInButtonRef = useRef<HTMLButtonElement>(null)

useEffect(() => {
  if (error?.includes('No passkey found')) {
    createButtonRef.current?.focus()
  } else if (error?.includes('already have')) {
    signInButtonRef.current?.focus()
  }
}, [error])
```

**Dialog Return Focus:**
- When Porto dialog closes → return focus to triggering button
- Porto SDK handles this automatically in dialog mode

### Screen Reader Announcements

```typescript
// Error banner (line 203)
<div
  role="alert"           // ← Immediate announcement
  aria-live="polite"     // ← Don't interrupt user
>
  <AlertCircle className="w-4 h-4" />
  <span className="text-sm">{error}</span>
</div>

// Loading state (line 227)
<span className="flex items-center justify-center gap-2">
  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
  Signing in...  // ← Announced to screen readers
</span>
```

### Collapsible Education

```typescript
// "Why passkeys?" button (VillaAuthDialog, line 141)
<button
  onClick={() => setShowEducation(!showEducation)}
  aria-expanded={showEducation}      // ← Expansion state
  aria-controls="passkey-education"  // ← Controlled element
>
  <Info className="w-4 h-4" />
  Why passkeys?
  {showEducation ? <ChevronUp /> : <ChevronDown />}
</button>

<AnimatePresence>
  {showEducation && (
    <div id="passkey-education">
      {/* Education content */}
    </div>
  )}
</AnimatePresence>
```

### Motion Preferences

```typescript
// Respect prefers-reduced-motion (VillaAuthDialog, lines 38-45)
const shouldReduceMotion = useReducedMotion()  // Framer Motion hook

const prefersReducedMotion = useRef(
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
).current

// Apply to animations (line 214)
<motion.button
  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}  // ← Skip animation
  transition={springConfig}
>
```

### Keyboard Navigation

**Tab Order:**
1. "Why passkeys?" toggle (optional)
2. "Sign In" button
3. "Create Villa ID" button
4. Provider logos (informational, not focusable)

**Enter/Space:**
- Activates focused button
- Opens Porto dialog with proper focus trap

**Escape:**
- Closes education panel (if open)
- Porto dialog handles its own Escape (closes dialog)

---

## Test Scenarios

### E2E Tests (Playwright)

**File:** `apps/web/tests/e2e/passkey-auth.spec.ts`

```typescript
test.describe('Passkey Authentication', () => {

  test('Sign In - shows error if no passkey exists', async ({ page }) => {
    await page.goto('/')

    // Mock Porto dialog to return InvalidStateError
    await page.addInitScript(() => {
      window.porto = {
        signIn: async () => ({
          success: false,
          error: {
            code: 'InvalidStateError',
            message: 'No passkey found'
          }
        })
      }
    })

    await page.click('button:has-text("Sign In")')

    // Verify error message
    await expect(page.locator('[role="alert"]')).toContainText('No passkey found')

    // Verify "Create Villa ID" is suggested
    await expect(page.locator('button:has-text("Create Villa ID")')).toBeFocused()
  })

  test('Create Villa ID - shows error if passkey already exists', async ({ page }) => {
    await page.goto('/')

    // Mock Porto dialog to return InvalidStateError
    await page.addInitScript(() => {
      window.porto = {
        createAccount: async () => ({
          success: false,
          error: {
            code: 'InvalidStateError',
            message: 'Passkey already exists'
          }
        })
      }
    })

    await page.click('button:has-text("Create Villa ID")')

    // Verify error message
    await expect(page.locator('[role="alert"]')).toContainText('already have')

    // Verify "Sign In" is suggested
    await expect(page.locator('button:has-text("Sign In")')).toBeFocused()
  })

  test('User cancellation - no error shown', async ({ page }) => {
    await page.goto('/')

    // Mock Porto dialog cancellation
    await page.addInitScript(() => {
      window.porto = {
        signIn: async () => ({
          success: false,
          error: { message: 'User cancelled the request' }
        })
      }
    })

    await page.click('button:has-text("Sign In")')

    // Verify no error message shown
    await expect(page.locator('[role="alert"]')).not.toBeVisible()

    // Verify buttons are re-enabled
    await expect(page.locator('button:has-text("Sign In")')).toBeEnabled()
  })

  test('Successful sign in - redirects to app', async ({ page }) => {
    await page.goto('/')

    // Mock successful sign in
    await page.addInitScript(() => {
      window.porto = {
        signIn: async () => ({
          success: true,
          address: '0x1234567890abcdef1234567890abcdef12345678'
        })
      }
    })

    await page.click('button:has-text("Sign In")')

    // Verify redirect to authenticated state
    await expect(page).toHaveURL(/\/(app|home|onboarding)/)
  })

  test('Accessibility - keyboard navigation', async ({ page }) => {
    await page.goto('/')

    // Tab through elements
    await page.keyboard.press('Tab')
    await expect(page.locator('button:has-text("Why passkeys?")')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.locator('button:has-text("Sign In")')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.locator('button:has-text("Create Villa ID")')).toBeFocused()

    // Enter activates button
    await page.keyboard.press('Enter')
    // (Porto dialog would open here)
  })

  test('Motion preference - reduced motion disables animations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    // Verify animations are skipped (check for static styles)
    const button = page.locator('button:has-text("Sign In")')
    const transform = await button.evaluate(el =>
      window.getComputedStyle(el).transform
    )

    // No scale animation applied
    expect(transform).toBe('none')
  })

  test('Education panel - expand/collapse', async ({ page }) => {
    await page.goto('/')

    const toggle = page.locator('button:has-text("Why passkeys?")')
    const panel = page.locator('#passkey-education')

    // Initially collapsed
    await expect(panel).not.toBeVisible()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')

    // Click to expand
    await toggle.click()
    await expect(panel).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')

    // Click to collapse
    await toggle.click()
    await expect(panel).not.toBeVisible()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})
```

---

### Manual Testing (1Password Integration)

**Critical:** E2E tests don't validate password manager ecosystem. Manual testing required.

**Test Device Requirements:**
- Physical device with biometric (not VM)
- 1Password browser extension installed
- Villa running on HTTPS (https://localhost:3000 or ngrok)

**Test Steps:**

```
1. Passkey Creation with 1Password
   [ ] Open https://localhost:3000 in Safari/Chrome
   [ ] Click "Create Villa ID"
   [ ] Porto dialog appears
   [ ] 1Password option shows in passkey picker
   [ ] Select 1Password
   [ ] 1Password prompts for master password/biometric
   [ ] Passkey created successfully
   [ ] Redirects to authenticated state

2. Passkey Sign In with 1Password
   [ ] Sign out of Villa
   [ ] Click "Sign In"
   [ ] Porto dialog appears
   [ ] 1Password automatically suggests passkey
   [ ] Confirm with 1Password biometric
   [ ] Sign in successful

3. Error Handling
   [ ] Sign In without existing passkey → error shown
   [ ] Create Villa ID when already exists → error shown
   [ ] Cancel Porto dialog → no error, buttons re-enabled
   [ ] Network offline → timeout error shown

4. Accessibility
   [ ] Tab through all focusable elements
   [ ] Screen reader announces errors
   [ ] Reduced motion preference respected
   [ ] Education panel expand/collapse works
```

**1Password Test Failure Indicators:**
- 1Password option missing from passkey picker
- Native OS dialog appears instead of 1Password
- Passkey saved to iCloud instead of 1Password

**If test fails:** Check LEARNINGS.md Pattern 50. Likely cause: relay mode used instead of dialog mode.

---

### Unit Tests (Jest/Vitest)

**File:** `apps/web/tests/unit/passkey-auth.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VillaAuthDialog } from '@/components/sdk/VillaAuthDialog'
import { signInDialog, createAccountDialog } from '@/lib/porto'

jest.mock('@/lib/porto')

describe('VillaAuthDialog', () => {

  test('renders welcome screen with primary actions', () => {
    render(<VillaAuthDialog />)

    expect(screen.getByText(/Your identity\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Villa ID/i })).toBeInTheDocument()
  })

  test('displays loading state on sign in', async () => {
    (signInDialog as jest.Mock).mockImplementation(() => new Promise(() => {}))

    render(<VillaAuthDialog />)

    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/Signing in\.\.\./)).toBeInTheDocument()
    })
  })

  test('shows error message on failure', async () => {
    (signInDialog as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: 'No passkey found' }
    })

    render(<VillaAuthDialog />)

    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No passkey found')
    })
  })

  test('does not show error on user cancellation', async () => {
    (signInDialog as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: 'User cancelled the request' }
    })

    render(<VillaAuthDialog />)

    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  test('calls onSuccess callback on successful auth', async () => {
    const onSuccess = jest.fn()
    const mockAddress = '0x1234567890abcdef1234567890abcdef12345678'

    (signInDialog as jest.Mock).mockResolvedValue({
      success: true,
      address: mockAddress
    })

    render(<VillaAuthDialog onSuccess={onSuccess} />)

    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockAddress)
    })
  })

  test('toggles education panel', () => {
    render(<VillaAuthDialog />)

    const toggle = screen.getByRole('button', { name: /Why passkeys\?/i })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Phishing-resistant/)).toBeInTheDocument()
  })
})
```

---

## Implementation Checklist

### VillaAuthDialog (Dialog Mode)

- [x] Porto dialog integration (`signInDialog`, `createAccountDialog`)
- [x] Loading states with spinners
- [x] Error handling (display + focus management)
- [x] Cancellation suppression (no error on cancel)
- [x] ARIA labels and roles
- [x] Keyboard navigation
- [x] Motion preferences (reduced motion)
- [x] Education panel (collapsible)
- [x] Provider logos (1Password, iCloud, Google, etc.)
- [x] Trust badge
- [x] Responsive layout (mobile-first)

### VillaAuthScreen (Relay Mode)

- [x] Porto relay integration (`signInHeadless`, `createAccountHeadless`)
- [x] PasskeyPrompt overlay
- [x] WebAuthn handler setup
- [x] Loading states
- [x] Error handling
- [x] ARIA labels
- [x] Keyboard navigation
- [x] Motion preferences
- [x] Provider logos (no 1Password)
- [x] Warning comment in code

### PasskeyPrompt (Relay Overlay)

- [x] Animated icon (Fingerprint vs Scan)
- [x] Contextual messaging ("Creating" vs "Authenticating")
- [x] Pulsing dots indicator
- [x] Backdrop blur
- [x] Motion preferences
- [x] Centered modal layout

### Porto Integration (`lib/porto.ts`)

- [x] Dialog mode functions (`signInDialog`, `createAccountDialog`)
- [x] Relay mode functions (`signInHeadless`, `createAccountHeadless`)
- [x] Error normalization
- [x] Result type (success/failure)
- [x] WebAuthn handler setup (`setWebAuthnHandlers`)

### E2E Tests

- [ ] Sign in flow (success + errors)
- [ ] Create account flow (success + errors)
- [ ] Cancellation handling
- [ ] Accessibility (keyboard, screen reader)
- [ ] Motion preferences
- [ ] Education panel

### Manual Tests

- [ ] 1Password integration (dialog mode)
- [ ] Device biometric (both modes)
- [ ] Error states (all error types)
- [ ] Accessibility (screen reader, keyboard)
- [ ] Cross-browser (Chrome, Safari, Firefox)
- [ ] Cross-platform (iOS, Android, desktop)

---

## Related Files

**Components:**
- `/apps/web/src/components/sdk/VillaAuthDialog.tsx` - Dialog mode UI
- `/apps/web/src/components/sdk/VillaAuthScreen.tsx` - Relay mode UI
- `/apps/web/src/components/sdk/PasskeyPrompt.tsx` - Loading overlay

**Porto Integration:**
- `/apps/web/src/lib/porto.ts` - SDK wrapper functions

**Tests:**
- `/apps/web/tests/e2e/integration.spec.ts` - E2E passkey tests
- `/apps/web/tests/unit/` - Unit tests (TODO)

**Documentation:**
- `/.claude/LEARNINGS.md` - Pattern 50 (Porto mode selection)
- `/specs/STATUS.md` - Feature status tracking

---

## Glossary

**Dialog Mode:** Porto SDK mode where Porto shows iframe dialog. 1Password can intercept.

**Relay Mode:** Porto SDK mode where Villa controls UI via WebAuthn handlers. Breaks ecosystem.

**WebAuthn:** W3C standard for passwordless authentication (passkeys).

**Passkey Manager:** Software that stores passkeys (1Password, iCloud Keychain, Google Password Manager).

**Porto:** SDK provider for passkey management (porto.sh).

**FIDO2:** Industry standard for hardware security keys (YubiKey, etc.).

---

## Open Questions

- [ ] Should we show "Why passkeys?" panel expanded by default for first-time users?
- [ ] Should we add analytics for error types (track which errors are most common)?
- [ ] Should we support hardware security keys explicitly (YubiKey messaging)?
- [ ] Should we add a "Learn more" link in error messages?

---

## Acceptance Criteria

**AC-1:** User can sign in with existing passkey using 1Password in dialog mode.
**AC-2:** User can create Villa ID with 1Password interception in dialog mode.
**AC-3:** User cancellation does not show error message.
**AC-4:** InvalidStateError guides user to correct action (create vs sign in).
**AC-5:** All error types show appropriate user-friendly messages.
**AC-6:** Keyboard navigation works for all interactive elements.
**AC-7:** Screen readers announce errors and loading states.
**AC-8:** Reduced motion preference disables animations.
**AC-9:** Education panel expands/collapses with proper ARIA attributes.
**AC-10:** Relay mode (SDK iframe) shows PasskeyPrompt overlay during WebAuthn.

---

**Last Updated:** 2026-01-10
**Status:** Active (implementation complete, tests in progress)
