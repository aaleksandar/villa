import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  PasskeyManagerType,
  WebAuthnErrorCode,
  parseWebAuthnError,
  detectBrowserCapabilities,
  isPasskeySupported,
  getPasskeyManagerName,
  getPortoHost,
  getChainConfig,
  validatePortoConfig,
  createVillaTheme,
  type PortoConfig,
} from '../auth-utils'

describe('auth-utils', () => {
  describe('parseWebAuthnError', () => {
    it('should parse user cancellation errors', () => {
      const error = new Error('User cancelled the operation')
      const result = parseWebAuthnError(error)

      expect(result.code).toBe(WebAuthnErrorCode.USER_CANCELLED)
      expect(result.shouldDisplay).toBe(false)
      expect(result.userMessage).toContain('cancelled')
    })

    it('should parse timeout errors', () => {
      const error = { name: 'TimeoutError', message: 'Operation timed out' }
      const result = parseWebAuthnError(error)

      expect(result.code).toBe(WebAuthnErrorCode.TIMEOUT)
      expect(result.shouldDisplay).toBe(true)
      expect(result.userMessage).toContain('timed out')
    })

    it('should parse NotAllowedError', () => {
      const error = { name: 'NotAllowedError', message: 'Not allowed' }
      const result = parseWebAuthnError(error)

      expect(result.code).toBe(WebAuthnErrorCode.USER_CANCELLED)
      expect(result.shouldDisplay).toBe(false)
    })

    it('should parse InvalidStateError', () => {
      const error = { name: 'InvalidStateError', message: 'Invalid state' }
      const result = parseWebAuthnError(error)

      expect(result.code).toBe(WebAuthnErrorCode.INVALID_STATE)
      expect(result.shouldDisplay).toBe(true)
      expect(result.userMessage).toContain('already exists')
    })

    it('should parse NetworkError', () => {
      const error = { name: 'NetworkError', message: 'Network failed' }
      const result = parseWebAuthnError(error)

      expect(result.code).toBe(WebAuthnErrorCode.NETWORK_ERROR)
      expect(result.shouldDisplay).toBe(true)
    })

    it('should handle unknown errors', () => {
      const error = { name: 'WeirdError', message: 'Something broke' }
      const result = parseWebAuthnError(error)

      expect(result.code).toBe(WebAuthnErrorCode.UNKNOWN)
      expect(result.shouldDisplay).toBe(true)
      expect(result.originalMessage).toBe('Something broke')
    })

    it('should handle non-error objects', () => {
      const result = parseWebAuthnError('string error')

      expect(result.code).toBe(WebAuthnErrorCode.UNKNOWN)
      expect(result.shouldDisplay).toBe(true)
    })

    it('should handle null/undefined', () => {
      const result = parseWebAuthnError(null)

      expect(result.code).toBe(WebAuthnErrorCode.UNKNOWN)
      expect(result.shouldDisplay).toBe(true)
    })
  })

  describe('detectBrowserCapabilities', () => {
    beforeEach(() => {
      // Reset window.PublicKeyCredential for each test
      vi.unstubAllGlobals()
    })

    it('should return false for all capabilities when WebAuthn is not supported', async () => {
      vi.stubGlobal('PublicKeyCredential', undefined)

      const caps = await detectBrowserCapabilities()

      expect(caps.webAuthnSupported).toBe(false)
      expect(caps.platformAuthenticatorAvailable).toBe(false)
      expect(caps.conditionalUIAvailable).toBe(false)
      expect(caps.passkeyManagers).toEqual([])
    })

    it('should detect WebAuthn support', async () => {
      const mockPublicKeyCredential = {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
        isConditionalMediationAvailable: vi.fn().mockResolvedValue(false),
      }
      vi.stubGlobal('PublicKeyCredential', mockPublicKeyCredential)

      const caps = await detectBrowserCapabilities()

      expect(caps.webAuthnSupported).toBe(true)
      expect(caps.platformAuthenticatorAvailable).toBe(true)
      expect(mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable).toHaveBeenCalled()
    })

    it('should detect conditional UI support', async () => {
      const mockPublicKeyCredential = {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
        isConditionalMediationAvailable: vi.fn().mockResolvedValue(true),
      }
      vi.stubGlobal('PublicKeyCredential', mockPublicKeyCredential)

      const caps = await detectBrowserCapabilities()

      expect(caps.conditionalUIAvailable).toBe(true)
    })
  })

  describe('isPasskeySupported', () => {
    it('should return true when PublicKeyCredential is available', () => {
      vi.stubGlobal('PublicKeyCredential', {})

      expect(isPasskeySupported()).toBe(true)
    })

    it('should return false when PublicKeyCredential is not available', () => {
      vi.stubGlobal('PublicKeyCredential', undefined)

      expect(isPasskeySupported()).toBe(false)
    })
  })

  describe('getPasskeyManagerName', () => {
    it('should return friendly names for each manager type', () => {
      expect(getPasskeyManagerName(PasskeyManagerType.PLATFORM)).toBe('Device Biometric')
      expect(getPasskeyManagerName(PasskeyManagerType.ONE_PASSWORD)).toBe('1Password')
      expect(getPasskeyManagerName(PasskeyManagerType.ICLOUD)).toBe('iCloud Keychain')
      expect(getPasskeyManagerName(PasskeyManagerType.GOOGLE)).toBe('Google Password Manager')
      expect(getPasskeyManagerName(PasskeyManagerType.FIDO2)).toBe('Security Key')
      expect(getPasskeyManagerName(PasskeyManagerType.UNKNOWN)).toBe('Unknown')
    })
  })

  describe('getPortoHost', () => {
    it('should return correct host for dialog mode', () => {
      expect(getPortoHost('dialog')).toBe('https://id.porto.sh/dialog')
    })

    it('should return correct host for relay mode', () => {
      expect(getPortoHost('relay')).toBe('https://id.porto.sh/relay')
    })

    it('should return correct host for iframe mode', () => {
      expect(getPortoHost('iframe')).toBe('https://id.porto.sh/dialog')
    })
  })

  describe('getChainConfig', () => {
    it('should return Base mainnet config for chain ID 8453', () => {
      const config = getChainConfig(8453)

      expect(config.id).toBe(8453)
      expect(config.name).toBe('Base')
      expect(config.network).toBe('base')
      expect(config.nativeCurrency.symbol).toBe('ETH')
      expect(config.rpcUrls.default.http[0]).toBe('https://mainnet.base.org')
    })

    it('should return Base Sepolia config for chain ID 84532', () => {
      const config = getChainConfig(84532)

      expect(config.id).toBe(84532)
      expect(config.name).toBe('Base Sepolia')
      expect(config.network).toBe('base-sepolia')
      expect(config.rpcUrls.default.http[0]).toBe('https://sepolia.base.org')
    })

    it('should default to Base mainnet for unknown chain IDs', () => {
      const config = getChainConfig(999999)

      expect(config.id).toBe(8453)
      expect(config.name).toBe('Base')
    })
  })

  describe('validatePortoConfig', () => {
    it('should validate a correct dialog config', () => {
      const config: PortoConfig = {
        mode: 'dialog',
        chainId: 8453,
      }

      expect(() => validatePortoConfig(config)).not.toThrow()
      expect(validatePortoConfig(config)).toBe(true)
    })

    it('should validate a correct relay config with keystoreHost', () => {
      const config: PortoConfig = {
        mode: 'relay',
        chainId: 8453,
        keystoreHost: 'villa.cash',
      }

      expect(() => validatePortoConfig(config)).not.toThrow()
      expect(validatePortoConfig(config)).toBe(true)
    })

    it('should reject config without mode', () => {
      const config = {
        chainId: 8453,
      } as PortoConfig

      expect(() => validatePortoConfig(config)).toThrow('Porto mode is required')
    })

    it('should reject config with invalid mode', () => {
      const config = {
        mode: 'invalid',
        chainId: 8453,
      } as unknown as PortoConfig

      expect(() => validatePortoConfig(config)).toThrow('Invalid Porto mode')
    })

    it('should reject config without chainId', () => {
      const config = {
        mode: 'dialog',
      } as PortoConfig

      expect(() => validatePortoConfig(config)).toThrow('Chain ID is required')
    })

    it('should reject config with unsupported chainId', () => {
      const config: PortoConfig = {
        mode: 'dialog',
        chainId: 1, // Ethereum mainnet - not supported
      }

      expect(() => validatePortoConfig(config)).toThrow('Unsupported chain ID')
    })

    it('should reject relay mode without keystoreHost', () => {
      const config: PortoConfig = {
        mode: 'relay',
        chainId: 8453,
      }

      expect(() => validatePortoConfig(config)).toThrow('keystoreHost is required for relay mode')
    })
  })

  describe('createVillaTheme', () => {
    it('should return Villa-branded theme config', () => {
      const theme = createVillaTheme()

      expect(theme.colorScheme).toBe('light')
      expect(theme.accent).toBe('#ffe047')
      expect(theme.primaryBackground).toBe('#ffe047')
      expect(theme.primaryContent).toBe('#382207')
      expect(theme.baseBackground).toBe('#fffcf8')
      expect(theme.baseContent).toBe('#0d0d17')
      expect(theme.frameRadius).toBe(14)
    })
  })
})
