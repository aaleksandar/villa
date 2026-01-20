# Cross-Chain Deposits - Security Blockers & Action Items

**Status:** BLOCKING PRODUCTION DEPLOYMENT
**Created:** 2026-01-08
**Priority:** P0 - Must resolve before implementation

---

## Critical Blockers (MUST RESOLVE)

### 1. Smart Contract Account Compatibility [BLOCKER]

**Issue:** Porto creates ERC-4337 smart contract wallets, NOT externally-owned accounts (EOAs). Glide SDK compatibility with smart account recipients is UNVERIFIED.

**Risk:** Deposits may fail silently or be lost if Glide doesn't support contract recipients.

**Action Required:**
```bash
# 1. Contact Glide Support
Email: support@buildwithglide.com
Subject: "ERC-4337 Smart Account Compatibility Question"

Body:
"Hi Glide Team,

We're integrating your SDK for cross-chain deposits to Base network.
Our users have smart contract wallets (ERC-4337 account abstraction)
created by Porto SDK, not standard EOAs.

Questions:
1. Does Glide support deposits to smart contract addresses?
2. Do any source chains have restrictions on contract recipients?
3. How does Glide handle gas estimation for undeployed contracts (CREATE2)?
4. Is there a testnet environment we can use to verify compatibility?

Our smart account details:
- Network: Base (Chain ID 8453)
- Account Standard: ERC-4337
- Deployed via: CREATE2 (address known before deployment)
- Provider: Porto SDK (https://porto.sh)

Thanks!
Villa Team (villa.cash)
"

# 2. Test on Base Sepolia
# Create fresh Porto account on testnet
# Attempt Glide deposit to that address
# Verify funds arrive correctly
# Document result in cross-chain-deposits-security.md
```

**Owner:** @build agent
**Deadline:** Before starting implementation
**Estimated Time:** 1-2 business days (waiting on Glide response)

---

### 2. Address Validation Implementation [BLOCKER]

**Issue:** No atomic validation that Glide recipient address matches Porto-derived address. Risk of address spoofing via localStorage tampering.

**Action Required:**

```typescript
// File: apps/web/src/lib/glide.ts

import { checkExistingAccount } from './porto'

/**
 * Validate that recipient address matches user's Porto address
 * CRITICAL: Must be called atomically before opening Glide widget
 */
export async function validateGlideRecipient(
  recipientAddress: string
): Promise<boolean> {
  const portoAddress = await checkExistingAccount()

  if (!portoAddress) {
    throw new Error('No Porto account found')
  }

  // Case-insensitive comparison (EVM addresses are case-insensitive)
  const match = recipientAddress.toLowerCase() === portoAddress.toLowerCase()

  if (!match) {
    console.error('Address mismatch detected', {
      glide: recipientAddress,
      porto: portoAddress,
    })
    throw new Error('Recipient address does not match Porto account')
  }

  return true
}

/**
 * Get validated recipient address for Glide
 * Returns address only after validation
 */
export async function getValidatedRecipient(): Promise<string> {
  const address = await checkExistingAccount()

  if (!address) {
    throw new Error('No Porto account found')
  }

  // Validate format (already done by Porto, but defense in depth)
  const addressRegex = /^0x[a-fA-F0-9]{40}$/
  if (!addressRegex.test(address)) {
    throw new Error('Invalid address format from Porto')
  }

  return address
}
```

**Test Coverage Required:**

```typescript
// File: apps/web/tests/unit/glide-validation.test.ts

describe('Glide Address Validation', () => {
  it('rejects mismatched recipient address', async () => {
    const portoAddress = '0x1234...'
    const attackerAddress = '0x5678...'

    await expect(
      validateGlideRecipient(attackerAddress)
    ).rejects.toThrow('does not match Porto account')
  })

  it('accepts matching recipient address', async () => {
    const address = '0x1234...'
    const result = await validateGlideRecipient(address)
    expect(result).toBe(true)
  })

  it('handles case-insensitive comparison', async () => {
    const lowerCase = '0xabcdef...'
    const upperCase = '0xABCDEF...'
    const result = await validateGlideRecipient(upperCase)
    expect(result).toBe(true)
  })
})
```

**Owner:** @build agent
**Deadline:** Before PR review
**Estimated Time:** 2 hours

---

### 3. Error Message Sanitization [BLOCKER]

**Issue:** Glide SDK may return error messages containing sensitive data (private keys, API keys, etc.). Must sanitize before displaying to users.

**Action Required:**

```typescript
// File: apps/web/src/lib/glide.ts

/**
 * Sanitize error messages from Glide to prevent data leakage
 */
export function sanitizeGlideError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unknown error occurred'
  }

  let message = error.message

  // Remove private keys (64 hex characters)
  message = message.replace(/0x[a-fA-F0-9]{64}/g, '[REDACTED]')

  // Remove email addresses
  message = message.replace(/\b[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]')

  // Remove credit card numbers (16-19 digits)
  message = message.replace(/\b\d{16,19}\b/g, '[CARD]')

  // Remove API keys/tokens
  message = message.replace(
    /\b(api[_-]?key|token|secret|bearer)[=:]\s*\S+/gi,
    '$1=[REDACTED]'
  )

  // Remove file paths
  message = message.replace(/\/[\w/.]+/g, '[PATH]')
  message = message.replace(/[A-Z]:\\[\w\\]+/g, '[PATH]')

  return message
}
```

**Usage:**

```typescript
// In AddFundsButton.tsx or GlideDepositModal.tsx
try {
  await openGlideDeposit(...)
} catch (error) {
  const safeMessage = sanitizeGlideError(error)
  toast.error(safeMessage) // Safe to display to user
  console.error('[Glide Error]', error) // Full error in console (for debugging)
}
```

**Test Coverage:** See `/Users/me/Documents/Coding/villa/apps/web/tests/security/funding-security.spec.ts` (lines 234-285)

**Owner:** @build agent
**Deadline:** Before PR review
**Estimated Time:** 1 hour

---

## High Priority (SHOULD RESOLVE)

### 4. CSP Headers for Glide Domains

**Issue:** No Content-Security-Policy configured to allowlist Glide domains. May block widget loading.

**Action Required:**

```typescript
// File: apps/web/next.config.js

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.buildwithglide.com;
      connect-src 'self' https://api.buildwithglide.com https://id.porto.sh;
      frame-src 'self' https://api.buildwithglide.com https://id.porto.sh;
      img-src 'self' data: https:;
      style-src 'self' 'unsafe-inline';
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

**Verification:**

```bash
# After deploying to staging
curl -I https://beta.villa.cash | grep -i "content-security-policy"

# Should see:
# Content-Security-Policy: default-src 'self'; script-src ...
```

**Owner:** @ops agent
**Deadline:** Before staging deployment
**Estimated Time:** 30 minutes

---

### 5. Privacy Policy Update

**Issue:** Glide integration creates new third-party data sharing relationship. Must disclose in privacy policy.

**Action Required:**

Add to Privacy Policy (privacy.md or legal docs):

```markdown
## Third-Party Services

### Cross-Chain Deposits (Glide)

When you use the "Add Funds" feature to deposit cryptocurrency from
other blockchains, we use Glide (buildwithglide.com) to facilitate
the cross-chain transfer.

**What Glide Sees:**
- Your destination wallet address (on Base network)
- Your source wallet address (the wallet you send from)
- Transaction amount and token type
- Your IP address (for fraud prevention)

**Why We Use Glide:**
Glide provides secure, multi-chain deposit infrastructure that allows
you to fund your Villa account from any supported blockchain.

**Your Privacy:**
Villa does not receive or store information about your source wallet,
transaction amounts, or other chains you interact with. This data is
processed solely by Glide.

**Glide's Privacy Policy:** https://buildwithglide.com/privacy
```

**Owner:** @human (legal review required)
**Deadline:** Before production launch
**Estimated Time:** 1 hour + legal review

---

### 6. Terms of Service Update

**Issue:** TOS must disclose third-party dependency and liability limitations.

**Action Required:**

Add to Terms of Service:

```markdown
## Third-Party Services

### Cross-Chain Deposits

Villa uses Glide (buildwithglide.com) to provide cross-chain deposit
functionality. By using this feature, you acknowledge:

1. **Third-Party Dependency:** Cross-chain deposits are processed by
   Glide's infrastructure, not Villa's.

2. **Service Availability:** We do not guarantee availability of
   cross-chain deposits. The feature may be temporarily unavailable
   due to Glide maintenance or technical issues.

3. **Transaction Failures:** If a deposit fails due to Glide service
   issues, Villa is not responsible for lost funds. You must contact
   Glide support for transaction recovery.

4. **Fees:** Glide charges fees for cross-chain deposits. These fees
   are disclosed before you confirm a transaction and are collected
   by Glide, not Villa.

5. **Security:** While we carefully vet third-party providers, Villa
   is not responsible for security vulnerabilities in Glide's
   infrastructure.

**Glide Terms of Service:** https://buildwithglide.com/terms
```

**Owner:** @human (legal review required)
**Deadline:** Before production launch
**Estimated Time:** 1 hour + legal review

---

## Medium Priority (NICE TO HAVE)

### 7. Monitoring and Alerting

**Action Required:**

```typescript
// File: apps/web/src/lib/analytics.ts

export function trackFundingEvent(
  event: 'funding_widget_opened' |
        'funding_deposit_started' |
        'funding_deposit_completed' |
        'funding_deposit_failed' |
        'funding_widget_closed',
  metadata?: {
    sourceChain?: string
    token?: string
    amount?: string
    error?: string
  }
): void {
  // Send to analytics (Plausible/Mixpanel)
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, { props: metadata })
  }

  // Log errors for monitoring
  if (event === 'funding_deposit_failed' && metadata?.error) {
    console.error('[Funding Failed]', {
      error: sanitizeGlideError(metadata.error),
      // Don't log amount or tokens (PII)
    })
  }
}
```

**Alerts:**

```yaml
# In monitoring config (e.g., Sentry, DataDog)
alerts:
  - name: "High Funding Failure Rate"
    condition: "funding_deposit_failed > 5% of funding_deposit_started"
    window: "1 hour"
    severity: "high"
    action: "Notify #eng-oncall"

  - name: "Glide Widget Loading Failure"
    condition: "funding_widget_opened = 0 for 10 minutes"
    severity: "critical"
    action: "Page #eng-oncall"
```

**Owner:** @ops agent
**Deadline:** Within 1 week of production launch
**Estimated Time:** 2 hours

---

### 8. User Education Content

**Action Required:**

Create help article: "How Cross-Chain Deposits Work"

```markdown
# How to Add Funds to Your Villa Account

Villa supports deposits from multiple blockchains using our
cross-chain funding feature.

## What You'll Need

- A wallet with cryptocurrency (MetaMask, Rainbow, Coinbase Wallet, etc.)
- OR cryptocurrency in an exchange account (Coinbase, Binance, etc.)

## Supported Chains

You can deposit from:
- Ethereum
- Arbitrum
- Optimism
- Polygon
- Avalanche
- BNB Chain
- And more...

## Step-by-Step Guide

1. Click "Add Funds" on your Villa home screen
2. Select your source chain (where your funds currently are)
3. Choose the token you want to send (USDC, ETH, etc.)
4. Enter the amount
5. Review the fees (shown before confirmation)
6. Connect your wallet and confirm the transaction
7. Wait 2-5 minutes for funds to arrive

## About Smart Contract Wallets

Your Villa account is a "smart contract wallet" (ERC-4337). This is
different from a traditional wallet, but works the same way for
receiving deposits.

Smart contract wallets provide:
- Better security (no seed phrase to lose)
- Biometric authentication (Face ID, Touch ID)
- Social recovery (if you lose your device)

## Fees

Cross-chain deposits include:
- **Network fees:** Gas costs on source and destination chains
- **Bridge fees:** Small percentage charged by the bridge protocol

All fees are shown upfront before you confirm.

## Troubleshooting

**Deposit not showing up?**
- Wait up to 10 minutes (some chains are slower)
- Check the block explorer for your transaction
- Contact support if funds don't arrive after 1 hour

**Transaction failed?**
- Check your wallet has enough balance (amount + fees)
- Try again with a lower amount
- Contact support if issue persists

## Security

Your funds go directly to your Villa smart contract wallet address.
Villa does not custody your funds - they are always under your control
via your passkey.

Cross-chain deposits are powered by Glide, a secure bridge protocol
audited by leading security firms.
```

**Owner:** @design agent
**Deadline:** Before production launch
**Estimated Time:** 1 hour

---

## Testing Checklist

### Pre-Implementation Tests

- [ ] Verify Porto smart account format is standard EVM address (0x + 40 hex)
- [ ] Confirm Porto deploys contracts via CREATE2 (address known pre-deployment)
- [ ] Test `checkExistingAccount()` returns correct address
- [ ] Review existing XSS tests pass (`pnpm test:security`)

### Implementation Tests (Unit)

- [ ] Address validation (`validateGlideRecipient()`) rejects mismatches
- [ ] Address validation accepts case-insensitive matches
- [ ] Error sanitization removes private keys
- [ ] Error sanitization removes email addresses
- [ ] Error sanitization removes API keys
- [ ] Error sanitization preserves useful context

### Implementation Tests (Integration)

- [ ] Glide widget loads with correct recipient address
- [ ] Widget close does not affect Villa state
- [ ] Success callback updates transaction history
- [ ] Failure callback displays sanitized error message
- [ ] Retry button preserves original transaction parameters

### Implementation Tests (E2E)

- [ ] Run `funding-security.spec.ts` (all tests pass)
- [ ] Address tampering via localStorage is prevented
- [ ] XSS in error messages is blocked
- [ ] Transaction data is validated
- [ ] No sensitive data in URL parameters
- [ ] CSP headers allow Glide domains

### Staging Tests

- [ ] Deploy to Base Sepolia testnet
- [ ] Create fresh Porto account on testnet
- [ ] Initiate Glide deposit from Ethereum Sepolia
- [ ] Verify funds arrive at correct address
- [ ] Test failure scenarios (insufficient balance, user cancellation)
- [ ] Test with multiple source chains (if supported)

### Production Tests (Post-Launch)

- [ ] Monitor first 10 deposits manually
- [ ] Verify analytics events are tracked
- [ ] Check error rate <5%
- [ ] Confirm support tickets <1% of deposits
- [ ] Review Glide logs for any issues

---

## Rollback Plan

If critical issues are discovered post-launch:

### Immediate Actions

1. **Disable Glide widget**
   ```typescript
   // In feature flag config
   export const FUNDING_ENABLED = false
   ```

2. **Show maintenance message**
   ```typescript
   // In AddFundsButton.tsx
   <Alert>
     Cross-chain deposits are temporarily unavailable for maintenance.
     Please use direct deposit from an exchange.
   </Alert>
   ```

3. **Notify affected users**
   - Send email to users who attempted deposits in last 24h
   - Provide alternative funding methods
   - ETA for resolution

### Investigation

- Review Glide API logs
- Check Base block explorer for failed transactions
- Contact Glide support for assistance
- Document issue in incident log

### Resolution

- Fix issue (code patch, Glide config change, etc.)
- Test on staging
- Re-enable feature
- Monitor closely for 24h

---

## Sign-Off Required

Before production deployment, obtain sign-off from:

- [ ] @build agent (implementation complete)
- [ ] @test agent (all tests pass)
- [ ] @ops agent (CSP headers deployed, monitoring configured)
- [ ] @human (legal docs updated, terms/privacy reviewed)
- [ ] **Glide Support** (smart account compatibility CONFIRMED)

**Final Blocker:** DO NOT DEPLOY until Glide confirms ERC-4337 support.

---

## Timeline Estimate

| Task | Owner | Time | Dependencies |
|------|-------|------|--------------|
| Contact Glide support | @build | 1 day | None |
| Wait for Glide response | Glide | 1-2 days | Email sent |
| Implement validation | @build | 2 hours | Glide confirmation |
| Implement sanitization | @build | 1 hour | None |
| Write unit tests | @test | 2 hours | Implementation |
| Run E2E tests | @test | 1 hour | Unit tests pass |
| Configure CSP | @ops | 30 min | None |
| Update legal docs | @human | 2 hours | Legal review |
| Deploy to staging | @ops | 30 min | Tests pass |
| Test on Base Sepolia | @test | 2 hours | Staging deployed |
| Deploy to production | @ops | 30 min | Staging verified |

**Total Estimated Time:** 5-7 days (mostly waiting on Glide response)

---

**Created:** 2026-01-08
**Status:** ACTIVE BLOCKERS
**Next Review:** After Glide response received
