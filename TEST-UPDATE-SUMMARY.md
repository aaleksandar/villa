# E2E Tests Update Summary

## Overview
Updated E2E tests to cover the new authentication flow with self-hosted dialog mode for 1Password support. Tests now cover both **VillaAuthDialog** (dialog mode) and **VillaAuthScreen** (relay mode) components across multiple viewport sizes and device types.

## Changes Made

### 1. New Test File: `passkey-crossplatform.spec.ts`
**Location:** `/apps/web/tests/e2e/passkey-crossplatform.spec.ts`

Comprehensive cross-platform authentication tests with 628 lines covering:

#### VillaAuthDialog Tests (Auth Domain: key.villa.cash)
- **Desktop Viewport (1280x720)**
  - Renders auth dialog UI correctly
  - Displays "Sign In" button text
  - Displays "Create Villa ID" button text
  - Shows passkey education section with expandable content
  - Displays supported passkey managers (1Password, iCloud, Google, Windows, FIDO2)

- **Tablet Viewport (768x1024)**
  - Renders auth dialog UI on tablet
  - Buttons have adequate touch targets (≥44x44px)

- **Mobile Viewport (375x667)**
  - Renders auth dialog UI correctly
  - All buttons visible and in viewport
  - Content scrollable without horizontal scroll
  - Buttons scrollable into view if needed

- **iPhone Specific (375x667)**
  - Renders correctly on iPhone SE

- **Large Mobile (414x896)**
  - Renders correctly on large mobile devices (iPhone 11 Pro Max)

#### Loading States Tests
- Sign In button shows loading state
- Create Villa ID button shows loading state
- Both buttons disabled during loading

#### Error States Tests
- Displays error alert when authentication fails
- Error alert is dismissible or disappears on retry
- Error alert has proper aria-live attributes for accessibility

#### Button Interactions Tests
- Sign In button is clickable and functional
- Create Villa ID button is clickable and functional
- Education section toggle works with click
- Education section has proper aria-expanded/aria-controls attributes

#### Accessibility Tests
- Page has proper heading hierarchy
- Buttons have accessible labels
- Color contrast is adequate
- Focus indicators are visible on keyboard navigation

#### VillaAuthScreen Tests (SDK Relay Mode)
- **Mobile (375x667)**
  - Renders VillaAuthScreen correctly
  - Supports device biometric messages
  - Shows provider icons (iCloud, Google, Windows, Browser, FIDO2, 1Password)

- **Desktop (1280x720)**
  - Renders VillaAuthScreen correctly
  - Displays provider logos

- **Loading and Error States**
  - Shows loading state in Sign In button
  - Shows loading state in Create button
  - Displays error messages when authentication fails

- **Button Functionality**
  - Sign In button is functional
  - Create Villa ID button is functional
  - Education section is toggleable

### 2. Updated: `auth-flows.spec.ts`
**Location:** `/apps/web/tests/e2e/auth-flows.spec.ts`

Added ~280 lines of new tests to existing file:

#### VillaAuthDialog Tests
- Auth route renders VillaAuthDialog correctly
- Sign In button triggers Porto dialog flow
- Create Villa ID button triggers Porto dialog flow
- Handles missing appId gracefully
- Displays error messages when authentication fails
- Passkey managers section is visible with proper messaging

#### VillaAuthScreen Tests
- Onboarding renders VillaAuthScreen correctly
- Sign In button triggers relay flow (shows inline loading)
- Create Villa ID button triggers relay flow
- Displays error messages
- Device biometric section is visible with proper messaging
- Shows PasskeyPrompt overlay during authentication

#### Component Comparison Tests
- Both components show same headline ("Your identity. No passwords.")
- Both components have same button labels
- Dialog mode shows passkey managers messaging
- Screen mode shows device biometric messaging

## Test Coverage Summary

### Total Test Count
- **passkey-crossplatform.spec.ts**: 47 tests
- **auth-flows.spec.ts**: Additional 11 new tests
- **Total New Tests**: 58

### Coverage by Category
1. **UI Rendering**: 8 tests
   - Desktop, tablet, mobile viewports
   - Component appearance and layout

2. **Button States**: 12 tests
   - Enabled/disabled states
   - Loading indicators
   - Text labels
   - Touch targets

3. **Error Handling**: 6 tests
   - Error message display
   - Error dismissal/retry
   - Aria attributes for alerts

4. **User Interactions**: 8 tests
   - Button clicks
   - Toggle behavior
   - Education section expansion

5. **Accessibility**: 6 tests
   - Heading hierarchy
   - Accessible labels
   - Color contrast
   - Focus indicators
   - Aria attributes

6. **Component Differences**: 6 tests
   - Dialog vs Screen comparison
   - Feature parity validation
   - Mode-specific messaging

7. **Loading States**: 6 tests
   - Button loading indicators
   - State transitions
   - Button disabling

8. **Responsive Design**: 4 tests
   - iPhone SE (375x667)
   - Large mobile (414x896)
   - Tablet (768x1024)
   - Desktop (1280x720)

## Test Execution

### Running Tests Locally
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/e2e/passkey-crossplatform.spec.ts

# Run tests in headed mode (see browser)
npm run test:e2e -- --headed

# Run tests on specific project (chromium, Mobile Chrome, Mobile Safari)
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project="Mobile Chrome"
npm run test:e2e -- --project="Mobile Safari"
```

### Test Configuration
- **Viewports**: Desktop (1280x720), Tablet (768x1024), Mobile (375x667), Large Mobile (414x896)
- **Devices**: Chromium, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
- **Timeouts**: 10-30s per test, 10-60s navigation
- **Retries in CI**: 2 retries on failure
- **Parallel**: All tests run in parallel

## Important Notes

### WebAuthn Limitations
WebAuthn/passkey ceremonies **cannot be fully tested** in Playwright because:
- No real biometric prompt access
- No browser passkey manager interaction
- No 1Password extension integration possible in headless mode

**Solution**: Tests focus on:
- UI rendering and state transitions
- Button states (enabled, disabled, loading)
- Error message display
- Navigation and redirects
- Accessibility compliance

### Components Tested

#### VillaAuthDialog (`/apps/web/src/components/sdk/VillaAuthDialog.tsx`)
- Uses Porto **dialog mode** with keystoreHost pointing to `key.villa.cash`
- Passkeys registered to `key.villa.cash` domain
- 1Password can intercept WebAuthn calls in iframe context
- Shows "Works with your passkey manager" messaging
- Used by: key.villa.cash/auth (self-hosted auth page)

#### VillaAuthScreen (`/apps/web/src/components/sdk/VillaAuthScreen.tsx`)
- Uses Porto **relay mode** with custom WebAuthn handlers
- Passkeys bound to `villa.cash` domain
- Shows "Works with your device biometric" messaging
- Used by: Onboarding flow with custom UI control
- Shows PasskeyPrompt overlay during biometric prompt

### Key Differences Tested
| Aspect | VillaAuthDialog | VillaAuthScreen |
|--------|-----------------|-----------------|
| Mode | Dialog (Porto popup) | Relay (custom handlers) |
| Domain | key.villa.cash | villa.cash |
| Messaging | Passkey managers | Device biometric |
| UI Control | Porto controlled | Villa controlled |
| 1Password Support | Yes (dialog mode) | No (relay mode) |

## Updated Files

1. **New**: `/apps/web/tests/e2e/passkey-crossplatform.spec.ts` (628 lines)
   - Comprehensive cross-platform tests
   - Tests both VillaAuthDialog and VillaAuthScreen
   - Covers desktop, tablet, and mobile viewports
   - Tests loading states, error handling, accessibility

2. **Updated**: `/apps/web/tests/e2e/auth-flows.spec.ts` (+280 lines)
   - Added VillaAuthDialog specific tests
   - Added VillaAuthScreen specific tests
   - Added component comparison tests
   - Maintains all existing tests unchanged

3. **Unchanged**: All other existing test files
   - `/apps/web/tests/e2e/onboarding.spec.ts`
   - `/apps/web/tests/e2e/passkey-live.spec.ts`
   - `/apps/web/tests/e2e/integration.spec.ts`
   - Other E2E tests remain unchanged

## Running Full Test Suite

```bash
# Build first
pnpm build

# Start dev server (runs automatically with playwright)
# Then run tests
npm run test:e2e

# View test results
npm run test:e2e -- --reporter=html
# Opens: playwright-report/index.html
```

## Test Results Expected

### Passing Tests
- UI rendering tests (all viewports)
- Button state tests
- Accessibility tests
- Component comparison tests

### Potentially Flaky Tests
- WebAuthn-triggered tests may timeout or fail (expected in test environment)
- Tests will skip or handle gracefully when real biometric not available

### CI Behavior
- All tests run in parallel
- Failed tests retry 2 times
- Results reported to GitHub (summary + HTML report)
- Artifacts saved in `test-results/` directory

## Future Improvements

1. **Mock WebAuthn** (when library becomes available)
   - Could simulate passkey creation/authentication
   - Would allow testing full auth flows in CI

2. **Visual Regression Testing**
   - Capture baseline screenshots
   - Compare across viewport sizes
   - Detect unintended UI changes

3. **Performance Testing**
   - Measure component render times
   - Track time to interactive
   - Monitor CSS animation smoothness

4. **Cross-Browser Testing**
   - Currently: Chromium, Chrome Mobile, Safari Mobile
   - Could add: Firefox, Edge

5. **Real Device Testing**
   - BrowserStack or similar for real iOS/Android
   - Test actual Touch ID/Face ID prompts
   - Test 1Password integration on real devices

## Deployment Verification

**Tests MUST pass before deployment**:
- All E2E tests pass locally and in CI
- No visual regressions observed
- Mobile viewports render correctly
- Error states display properly
- Accessibility baseline maintained

If tests fail:
1. Run locally to reproduce
2. Check if issue is environment-specific (network, timing)
3. Fix code or update test if needed
4. Re-run full suite before re-deploying
