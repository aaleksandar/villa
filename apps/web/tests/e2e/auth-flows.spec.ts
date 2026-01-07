import { test, expect } from '@playwright/test'

/**
 * Comprehensive E2E Tests for Villa Authentication Flows
 *
 * Tests all authentication pathways including:
 * - New user onboarding
 * - Returning user sign-in
 * - Auth iframe/popup flows
 * - Logout functionality
 * - Error handling
 *
 * Note: WebAuthn/passkey flows cannot be fully tested in Playwright,
 * so tests focus on UI state transitions, navigation, and error handling.
 */

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear state before each test
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test.describe('New User Onboarding Flow', () => {
    test('redirects to onboarding when no identity exists', async ({ page }) => {
      await page.goto('/')
      await page.waitForURL(/\/onboarding/, { timeout: 10000 })
      await expect(page).toHaveURL(/\/onboarding/)
    })

    test('shows welcome screen with authentication options', async ({ page }) => {
      await page.goto('/onboarding')

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle')

      // Check for main elements
      await expect(page.getByRole('heading', { name: 'Villa' })).toBeVisible({ timeout: 10000 })

      // Check for headline text - in VillaAuthScreen the text is split: "Your identity." and "No passwords." (gradient)
      // Use .first() since "No passwords." may appear in multiple places due to styling
      const headlineText = page.getByText(/your identity/i).first()
      await expect(headlineText).toBeVisible({ timeout: 10000 })

      // Check for CTA buttons with more flexible selectors
      const signInButton = page.getByRole('button', { name: /sign in/i })
      const createButton = page.getByRole('button', { name: /create villa id/i })

      await expect(signInButton).toBeVisible({ timeout: 10000 })
      await expect(createButton).toBeVisible({ timeout: 10000 })
      await expect(signInButton).toBeEnabled()
      await expect(createButton).toBeEnabled()

      // Check for security badge
      await expect(page.getByText(/secured by passkeys/i)).toBeVisible()
    })

    test('navigates to connecting state when creating account', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')

      // Wait for and click create account button
      const createButton = page.getByRole('button', { name: /create villa id/i })
      await createButton.waitFor({ state: 'visible', timeout: 10000 })
      await createButton.click()

      // Should show connecting/loading state OR error (Porto may fail in test env)
      // Check for various possible states
      const loadingIndicator = page.getByText(/connecting|creating|signing in/i)
      const errorHeading = page.getByRole('heading', { name: /something went wrong/i })
      const passkeyPrompt = page.getByText(/biometric|passkey|fingerprint/i)

      await expect(
        loadingIndicator.or(errorHeading).or(passkeyPrompt)
      ).toBeVisible({ timeout: 10000 })
    })

    test('can navigate through profile step with URL params', async ({ page }) => {
      // Simulate successful passkey creation by navigating directly to profile step
      await page.goto('/onboarding?step=profile&address=0x1234567890123456789012345678901234567890')

      // Should show profile step
      await expect(page.getByRole('heading', { name: 'Choose your @handle' })).toBeVisible()
      await expect(page.getByPlaceholder('yourname')).toBeVisible()
      await expect(page.getByText('This is how others will find you')).toBeVisible()
    })

    test('profile step validates nickname input', async ({ page }) => {
      await page.goto('/onboarding?step=profile&address=0x1234567890123456789012345678901234567890')

      const input = page.getByPlaceholder('yourname')
      const submitButton = page.getByRole('button', { name: /Claim @/i })

      // Button should be disabled when empty
      await expect(submitButton).toBeDisabled()

      // Enter valid nickname
      await input.fill('alice')
      await expect(submitButton).toBeEnabled()
      await expect(submitButton).toHaveText('Claim @alice')

      // Submit and verify navigation to avatar step
      await submitButton.click()
      await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()
    })

    test('profile step prevents submission with whitespace only', async ({ page }) => {
      await page.goto('/onboarding?step=profile&address=0x1234567890123456789012345678901234567890')

      const input = page.getByPlaceholder('yourname')
      const submitButton = page.getByRole('button', { name: /Claim @/i })

      // Enter only spaces
      await input.fill('   ')

      // Button should remain disabled (trimmed input is empty)
      await expect(submitButton).toBeDisabled()
    })

    test('avatar step displays selection options', async ({ page }) => {
      await page.goto('/onboarding?step=avatar&address=0x1234567890123456789012345678901234567890&displayName=alice')

      // Check for avatar selection UI
      await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()

      // Check for style options (exact match to avoid matching "Female-friendly")
      await expect(page.getByText('Female', { exact: true })).toBeVisible()
      await expect(page.getByText('Male', { exact: true })).toBeVisible()
      await expect(page.getByText('Other', { exact: true })).toBeVisible()

      // Check for select button
      await expect(page.getByRole('button', { name: 'Select' })).toBeVisible()
    })

    test('completing avatar redirects to home', async ({ page }) => {
      await page.goto('/onboarding?step=avatar&address=0x1234567890123456789012345678901234567890&displayName=alice')

      // Click select button
      await page.getByRole('button', { name: 'Select' }).click()

      // Should show success celebration
      await expect(page.getByRole('heading', { name: 'Perfect!' })).toBeVisible()

      // Should redirect to home
      await page.waitForURL(/\/home/, { timeout: 10000 })
      await expect(page).toHaveURL(/\/home/)

      // Verify identity is displayed
      await expect(page.getByText('@alice')).toBeVisible()
    })
  })

  test.describe('Returning User Flow', () => {
    test('redirects to home when complete identity exists', async ({ page }) => {
      // Set up complete identity
      await page.evaluate(() => {
        const identity = {
          state: {
            identity: {
              address: '0x1234567890123456789012345678901234567890',
              displayName: 'alice',
              avatar: {
                style: 'avataaars',
                selection: 'female',
                variant: 5,
              },
              createdAt: Date.now(),
            },
          },
          version: 0,
        }
        localStorage.setItem('villa-identity', JSON.stringify(identity))
      })

      await page.goto('/onboarding')
      await page.waitForURL(/\/home/, { timeout: 10000 })
      await expect(page).toHaveURL(/\/home/)
    })

    test('shows welcome-back step for returning user on new device', async ({ page }) => {
      // Simulate returning user (has nickname, no avatar yet)
      await page.goto('/onboarding?step=welcome-back&address=0x1234567890123456789012345678901234567890&displayName=alice')

      await expect(page.getByRole('heading', { name: 'Welcome back, @alice!' })).toBeVisible()
      await expect(page.getByText("Let's set up your look on this device")).toBeVisible()
    })

    test('welcome-back step auto-advances to avatar selection', async ({ page }) => {
      await page.goto('/onboarding?step=welcome-back&address=0x1234567890123456789012345678901234567890&displayName=alice')

      // Wait for auto-advance (2 seconds timeout)
      await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible({ timeout: 5000 })
    })

    test('navigates to connecting state when signing in', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')

      // Wait for and click sign in button
      const signInButton = page.getByRole('button', { name: /sign in/i })
      await signInButton.waitFor({ state: 'visible', timeout: 10000 })
      await signInButton.click()

      // Should show connecting/loading state OR error
      const loadingIndicator = page.getByText(/connecting|signing in/i)
      const errorHeading = page.getByRole('heading', { name: /something went wrong/i })
      const passkeyPrompt = page.getByText(/biometric|passkey|fingerprint/i)

      await expect(
        loadingIndicator.or(errorHeading).or(passkeyPrompt)
      ).toBeVisible({ timeout: 10000 })
    })

    test('home page displays user profile correctly', async ({ page }) => {
      // Set up identity
      await page.evaluate(() => {
        const identity = {
          state: {
            identity: {
              address: '0x1234567890123456789012345678901234567890',
              displayName: 'alice',
              avatar: {
                style: 'avataaars',
                selection: 'female',
                variant: 5,
              },
              createdAt: Date.now(),
            },
          },
          version: 0,
        }
        localStorage.setItem('villa-identity', JSON.stringify(identity))
      })

      await page.goto('/home')

      // Verify profile elements
      await expect(page.getByText('@alice')).toBeVisible()
      await expect(page.getByText('0x1234...7890')).toBeVisible()
      await expect(page.getByText('alice.villa.cash')).toBeVisible()
    })
  })

  test.describe('Auth Iframe/Popup Flow', () => {
    test('auth page renders VillaAuth component', async ({ page }) => {
      await page.goto('/auth?appId=test-app')
      await page.waitForLoadState('networkidle')

      // Should show welcome screen (VillaAuth initial state)
      // Note: In iframe mode, the auth page wraps VillaAuth
      await expect(page.getByRole('heading', { name: 'Villa' })).toBeVisible({ timeout: 10000 })
    })

    test('auth page accepts appId query parameter', async ({ page }) => {
      const appId = 'my-test-app'
      await page.goto(`/auth?appId=${appId}`)
      await page.waitForLoadState('networkidle')

      // Page should load successfully
      await expect(page.getByRole('heading', { name: 'Villa' })).toBeVisible({ timeout: 10000 })
    })

    test('auth page works with mode=popup parameter', async ({ page }) => {
      await page.goto('/auth?appId=test&mode=popup')
      await page.waitForLoadState('networkidle')

      // Should render auth screen
      await expect(page.getByRole('heading', { name: 'Villa' })).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('button', { name: /create villa id/i })).toBeVisible({ timeout: 10000 })
    })

    test('auth page works with origin parameter', async ({ page }) => {
      await page.goto('/auth?appId=test&origin=https://localhost:3000')
      await page.waitForLoadState('networkidle')

      // Should render successfully
      await expect(page.getByRole('heading', { name: 'Villa' })).toBeVisible({ timeout: 10000 })
    })

    test('VillaAuthScreen shows Sign In and Create Villa ID buttons', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const signInButton = page.getByRole('button', { name: /sign in/i })
      const createButton = page.getByRole('button', { name: /create villa id/i })

      await expect(signInButton).toBeVisible({ timeout: 10000 })
      await expect(createButton).toBeVisible({ timeout: 10000 })
      await expect(signInButton).toBeEnabled()
      await expect(createButton).toBeEnabled()
    })

    test('VillaAuthScreen shows loading state on button click', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      // Click sign in
      const signInButton = page.getByRole('button', { name: /sign in/i })
      await signInButton.waitFor({ state: 'visible', timeout: 10000 })
      await signInButton.click()

      // Should show loading state (either in button or separate state)
      const loadingText = page.getByText(/signing in|connecting|loading/i)
      const passkeyPrompt = page.getByText(/biometric|passkey/i)

      await expect(loadingText.or(passkeyPrompt)).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Logout Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Set up identity before each logout test
      await page.goto('/')
      await page.evaluate(() => {
        const identity = {
          state: {
            identity: {
              address: '0x1234567890123456789012345678901234567890',
              displayName: 'alice',
              avatar: {
                style: 'avataaars',
                selection: 'female',
                variant: 5,
              },
              createdAt: Date.now(),
            },
          },
          version: 0,
        }
        localStorage.setItem('villa-identity', JSON.stringify(identity))
      })
    })

    test('logout button is visible on home page', async ({ page }) => {
      await page.goto('/home')

      // Check for logout icon button in header
      const logoutButton = page.getByRole('button', { name: 'Sign out' })
      await expect(logoutButton).toBeVisible()
    })

    test('clicking logout redirects to onboarding', async ({ page }) => {
      await page.goto('/home')

      // Click logout in header
      await page.getByRole('button', { name: 'Sign out' }).click()

      // Should redirect to onboarding
      await page.waitForURL(/\/onboarding/, { timeout: 10000 })
      await expect(page).toHaveURL(/\/onboarding/)
    })

    test('logout clears identity from storage', async ({ page }) => {
      await page.goto('/home')

      // Click logout
      await page.getByRole('button', { name: 'Sign out' }).click()

      // Wait for redirect
      await page.waitForURL(/\/onboarding/)

      // Verify identity is cleared
      const identity = await page.evaluate(() => {
        return localStorage.getItem('villa-identity')
      })

      expect(identity).toBeNull()
    })

    test('switch account button also logs out', async ({ page }) => {
      await page.goto('/home')

      // Scroll to switch account button (at bottom)
      await page.getByRole('button', { name: 'Switch Account' }).scrollIntoViewIfNeeded()
      await page.getByRole('button', { name: 'Switch Account' }).click()

      // Should redirect to onboarding
      await page.waitForURL(/\/onboarding/, { timeout: 10000 })
      await expect(page).toHaveURL(/\/onboarding/)
    })

    test('after logout, can see welcome screen again', async ({ page }) => {
      await page.goto('/home')

      // Logout
      await page.getByRole('button', { name: 'Sign out' }).click()
      await page.waitForURL(/\/onboarding/)
      await page.waitForLoadState('networkidle')

      // Should see welcome screen elements
      await expect(page.getByRole('heading', { name: 'Villa' })).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('button', { name: /create villa id/i })).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Error Handling', () => {
    test('shows error step UI correctly', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')

      // Try to trigger error by clicking create account
      const createButton = page.getByRole('button', { name: /create villa id/i })
      await createButton.waitFor({ state: 'visible', timeout: 10000 })
      await createButton.click()

      // Wait for either connecting or error state
      await page.waitForTimeout(3000)

      // Check if error state appeared (will happen in non-WebAuthn environments)
      const errorHeading = page.getByRole('heading', { name: /something went wrong/i })
      const isError = await errorHeading.isVisible().catch(() => false)

      if (isError) {
        // Verify error UI elements
        await expect(errorHeading).toBeVisible()
        await expect(page.getByRole('button', { name: /try again/i })).toBeVisible()

        // Error message should be present
        const errorText = page.getByText(/cancelled|failed|error|browser|passkey/i)
        await expect(errorText).toBeVisible()
      }
    })

    test('error step retry button returns to welcome', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')

      // Try to create account (will likely error in test env)
      const createButton = page.getByRole('button', { name: /create villa id/i })
      await createButton.waitFor({ state: 'visible', timeout: 10000 })
      await createButton.click()

      // Wait for state change
      await page.waitForTimeout(3000)

      // If error state appears, test retry
      const errorHeading = page.getByRole('heading', { name: /something went wrong/i })
      const isError = await errorHeading.isVisible().catch(() => false)

      if (isError) {
        await page.getByRole('button', { name: /try again/i }).click()

        // Should return to welcome screen
        await expect(page.getByRole('heading', { name: 'Villa' })).toBeVisible({ timeout: 10000 })
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 10000 })
      }
    })

    test('handles missing address gracefully in profile step', async ({ page }) => {
      // Navigate to profile step without address param
      await page.goto('/onboarding?step=profile')
      await page.waitForLoadState('networkidle')

      // Should still show profile step
      await expect(page.getByRole('heading', { name: 'Choose your @handle' })).toBeVisible({ timeout: 10000 })

      // Try to submit
      await page.getByPlaceholder('yourname').fill('testuser')
      await page.getByRole('button', { name: /Claim @/i }).click()

      // Should show error (no address to save profile)
      await expect(page.getByRole('heading', { name: /something went wrong/i })).toBeVisible({ timeout: 10000 })
    })

    test('displays validation errors for invalid nicknames', async ({ page }) => {
      await page.goto('/onboarding?step=profile&address=0x1234567890123456789012345678901234567890')
      await page.waitForLoadState('networkidle')

      const input = page.getByPlaceholder('yourname')

      // Try submitting with invalid characters (should be cleaned automatically or show error)
      await input.fill('invalid@name!')

      // Most implementations clean input in real-time, but verify button state
      const inputValue = await input.inputValue()
      expect(inputValue).not.toMatch(/[@!]/)
    })

    test('handles network errors gracefully', async ({ page }) => {
      await page.goto('/onboarding?step=profile&address=0x1234567890123456789012345678901234567890')
      await page.waitForLoadState('networkidle')

      // Set up offline mode AFTER page load
      await page.context().setOffline(true)

      // Fill nickname and try to submit
      await page.getByPlaceholder('yourname').fill('alice')
      await page.getByRole('button', { name: /Claim @/i }).click()

      // Should still proceed to avatar (nickname claim is non-blocking)
      // or show error - either is acceptable
      await expect(
        page.getByRole('heading', { name: 'Pick your look' })
          .or(page.getByRole('heading', { name: /something went wrong/i }))
      ).toBeVisible({ timeout: 10000 })

      // Restore online mode
      await page.context().setOffline(false)
    })
  })

  test.describe('Navigation and State Persistence', () => {
    test('direct navigation to /home without identity redirects to onboarding', async ({ page }) => {
      await page.goto('/home')

      await page.waitForURL(/\/onboarding/, { timeout: 10000 })
      await expect(page).toHaveURL(/\/onboarding/)
    })

    test('identity persists across page reloads', async ({ page }) => {
      // Set up identity
      await page.evaluate(() => {
        const identity = {
          state: {
            identity: {
              address: '0x1234567890123456789012345678901234567890',
              displayName: 'alice',
              avatar: {
                style: 'avataaars',
                selection: 'female',
                variant: 5,
              },
              createdAt: Date.now(),
            },
          },
          version: 0,
        }
        localStorage.setItem('villa-identity', JSON.stringify(identity))
      })

      await page.goto('/home')
      await expect(page.getByText('@alice')).toBeVisible()

      // Reload page
      await page.reload()

      // Identity should still be visible
      await expect(page.getByText('@alice')).toBeVisible()
    })

    test('can navigate between onboarding steps using URL params', async ({ page }) => {
      const address = '0x1234567890123456789012345678901234567890'

      // Navigate to profile
      await page.goto(`/onboarding?step=profile&address=${address}`)
      await expect(page.getByRole('heading', { name: 'Choose your @handle' })).toBeVisible()

      // Navigate to avatar
      await page.goto(`/onboarding?step=avatar&address=${address}&displayName=alice`)
      await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()

      // Navigate to success
      await page.goto(`/onboarding?step=success&address=${address}`)
      await expect(page.getByRole('heading', { name: 'Connected!' })).toBeVisible()
    })

    test('prevents navigation to protected routes without identity', async ({ page }) => {
      const protectedRoutes = ['/home', '/settings']

      for (const route of protectedRoutes) {
        await page.goto(route)

        // Should redirect to onboarding
        await page.waitForURL(/\/onboarding/, { timeout: 10000 })
        await expect(page).toHaveURL(/\/onboarding/)
      }
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
    })

    test('welcome screen renders correctly on mobile', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')

      // Check all elements are visible and in viewport
      await expect(page.getByRole('heading', { name: 'Villa' })).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('heading', { name: 'Villa' })).toBeInViewport()

      const signInButton = page.getByRole('button', { name: /sign in/i })
      const createButton = page.getByRole('button', { name: /create villa id/i })

      await expect(signInButton).toBeVisible({ timeout: 10000 })
      await expect(signInButton).toBeInViewport()
      await expect(createButton).toBeVisible({ timeout: 10000 })
      await expect(createButton).toBeInViewport()
    })

    test('profile step renders correctly on mobile', async ({ page }) => {
      await page.goto('/onboarding?step=profile&address=0x1234567890123456789012345678901234567890')

      await expect(page.getByRole('heading', { name: 'Choose your @handle' })).toBeVisible()
      await expect(page.getByPlaceholder('yourname')).toBeInViewport()
    })

    test('avatar selection renders correctly on mobile', async ({ page }) => {
      await page.goto('/onboarding?step=avatar&address=0x1234567890123456789012345678901234567890&displayName=alice')

      await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Select' })).toBeInViewport()
    })

    test('home page renders correctly on mobile', async ({ page }) => {
      // Set up identity
      await page.evaluate(() => {
        const identity = {
          state: {
            identity: {
              address: '0x1234567890123456789012345678901234567890',
              displayName: 'alice',
              avatar: {
                style: 'avataaars',
                selection: 'female',
                variant: 5,
              },
              createdAt: Date.now(),
            },
          },
          version: 0,
        }
        localStorage.setItem('villa-identity', JSON.stringify(identity))
      })

      await page.goto('/home')

      await expect(page.getByText('@alice')).toBeVisible()
      await expect(page.getByText('@alice')).toBeInViewport()
    })

    test('buttons have adequate touch targets on mobile', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')

      const signInButton = page.getByRole('button', { name: /sign in/i })
      const createButton = page.getByRole('button', { name: /create villa id/i })

      // Wait for buttons to be visible
      await signInButton.waitFor({ state: 'visible', timeout: 10000 })
      await createButton.waitFor({ state: 'visible', timeout: 10000 })

      // Check button sizes (should be at least 44x44 for touch targets)
      const signInBox = await signInButton.boundingBox()
      const createBox = await createButton.boundingBox()

      expect(signInBox?.height).toBeGreaterThanOrEqual(44)
      expect(createBox?.height).toBeGreaterThanOrEqual(44)
    })
  })
})
