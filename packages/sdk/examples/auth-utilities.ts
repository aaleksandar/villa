/**
 * Villa SDK - Auth Utilities Example
 *
 * This example demonstrates how to use the low-level authentication utilities
 * to build custom passkey authentication flows.
 */

import {
  detectBrowserCapabilities,
  parseWebAuthnError,
  isPasskeySupported,
  getPasskeyManagerName,
  PasskeyManagerType,
  WebAuthnErrorCode,
  createVillaTheme,
  validatePortoConfig,
  getChainConfig,
} from '@rockfridrich/villa-sdk'

/**
 * Example 1: Check browser support before showing auth UI
 */
async function checkBrowserSupport() {
  console.log('=== Browser Support Check ===')

  // Quick check
  if (!isPasskeySupported()) {
    console.error('❌ Passkeys are not supported in this browser')
    return false
  }

  console.log('✅ Passkeys are supported')

  // Detailed capability detection
  const capabilities = await detectBrowserCapabilities()

  console.log('WebAuthn supported:', capabilities.webAuthnSupported)
  console.log('Platform authenticator:', capabilities.platformAuthenticatorAvailable)
  console.log('Conditional UI (autofill):', capabilities.conditionalUIAvailable)
  console.log('User-verifying platform:', capabilities.userVerifyingPlatformAuthenticator)

  // Show available passkey managers
  console.log('\nAvailable passkey managers:')
  capabilities.passkeyManagers.forEach(manager => {
    const name = getPasskeyManagerName(manager)
    console.log(`  - ${name}`)
  })

  return true
}

/**
 * Example 2: Handle WebAuthn errors gracefully
 */
async function handleWebAuthnErrors() {
  console.log('\n=== WebAuthn Error Handling ===')

  // Simulate different WebAuthn errors
  const testErrors = [
    new Error('User cancelled the operation'),
    { name: 'TimeoutError', message: 'Operation timed out' },
    { name: 'NotAllowedError', message: 'Not allowed' },
    { name: 'InvalidStateError', message: 'Credential already exists' },
    { name: 'NetworkError', message: 'Network failed' },
    { name: 'UnknownError', message: 'Something weird happened' },
  ]

  testErrors.forEach(error => {
    const parsed = parseWebAuthnError(error)

    console.log('\nOriginal error:', error)
    console.log('  Code:', parsed.code)
    console.log('  User message:', parsed.userMessage)
    console.log('  Should display:', parsed.shouldDisplay)

    // In real app, only show errors that should be displayed
    if (parsed.shouldDisplay) {
      // showErrorToUser(parsed.userMessage)
    }
  })
}

/**
 * Example 3: Display available authentication methods
 */
async function displayAuthMethods() {
  console.log('\n=== Available Authentication Methods ===')

  const capabilities = await detectBrowserCapabilities()

  if (capabilities.platformAuthenticatorAvailable) {
    console.log('✅ Device biometric (Touch ID, Face ID, Windows Hello)')
  }

  capabilities.passkeyManagers.forEach(manager => {
    switch (manager) {
      case PasskeyManagerType.ONE_PASSWORD:
        console.log('✅ 1Password browser extension')
        break
      case PasskeyManagerType.ICLOUD:
        console.log('✅ iCloud Keychain')
        break
      case PasskeyManagerType.GOOGLE:
        console.log('✅ Google Password Manager')
        break
      case PasskeyManagerType.FIDO2:
        console.log('✅ FIDO2 security key')
        break
    }
  })
}

/**
 * Example 4: Validate Porto configuration
 */
function validateConfiguration() {
  console.log('\n=== Porto Configuration Validation ===')

  // Valid dialog mode config
  const dialogConfig = {
    mode: 'dialog' as const,
    chainId: 8453,
  }

  try {
    validatePortoConfig(dialogConfig)
    console.log('✅ Dialog config is valid')
  } catch (error) {
    console.error('❌ Dialog config error:', error)
  }

  // Valid relay mode config
  const relayConfig = {
    mode: 'relay' as const,
    chainId: 8453,
    keystoreHost: 'villa.cash',
  }

  try {
    validatePortoConfig(relayConfig)
    console.log('✅ Relay config is valid')
  } catch (error) {
    console.error('❌ Relay config error:', error)
  }

  // Invalid config (missing keystoreHost for relay)
  const invalidConfig = {
    mode: 'relay' as const,
    chainId: 8453,
  }

  try {
    validatePortoConfig(invalidConfig)
    console.log('✅ Invalid config accepted (should not happen)')
  } catch (error) {
    console.log('✅ Invalid config rejected:', (error as Error).message)
  }
}

/**
 * Example 5: Get chain configurations
 */
function showChainConfigs() {
  console.log('\n=== Chain Configurations ===')

  // Base mainnet
  const baseConfig = getChainConfig(8453)
  console.log('Base Mainnet:')
  console.log('  ID:', baseConfig.id)
  console.log('  Name:', baseConfig.name)
  console.log('  RPC:', baseConfig.rpcUrls.default.http[0])
  console.log('  Explorer:', baseConfig.blockExplorers.default.url)

  // Base Sepolia testnet
  const sepoliaConfig = getChainConfig(84532)
  console.log('\nBase Sepolia:')
  console.log('  ID:', sepoliaConfig.id)
  console.log('  Name:', sepoliaConfig.name)
  console.log('  RPC:', sepoliaConfig.rpcUrls.default.http[0])
  console.log('  Explorer:', sepoliaConfig.blockExplorers.default.url)
}

/**
 * Example 6: Get Villa theme
 */
function showVillaTheme() {
  console.log('\n=== Villa Theme ===')

  const theme = createVillaTheme()
  console.log('Color scheme:', theme.colorScheme)
  console.log('Accent color:', theme.accent)
  console.log('Primary background:', theme.primaryBackground)
  console.log('Primary content:', theme.primaryContent)
  console.log('Base background:', theme.baseBackground)
  console.log('Base content:', theme.baseContent)
  console.log('Frame radius:', theme.frameRadius)
}

/**
 * Run all examples
 */
async function main() {
  console.log('Villa SDK - Auth Utilities Examples\n')

  await checkBrowserSupport()
  await handleWebAuthnErrors()
  await displayAuthMethods()
  validateConfiguration()
  showChainConfigs()
  showVillaTheme()

  console.log('\n✅ All examples complete!')
}

// Run examples if this file is executed directly
if (typeof window !== 'undefined') {
  main().catch(console.error)
}

// Export for use as module
export {
  checkBrowserSupport,
  handleWebAuthnErrors,
  displayAuthMethods,
  validateConfiguration,
  showChainConfigs,
  showVillaTheme,
}
