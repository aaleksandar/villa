# Cross-Chain Deposits - Security Action Items

**Status:** Ready for Implementation
**Blocker:** Smart account compatibility verification required
**Last Updated:** 2026-01-08

---

## Quick Summary

Security review is complete. Tests are written. ONE critical question must be answered before implementation:

**Does Glide SDK support deposits to ERC-4337 smart contract wallets?**

---

## Immediate Actions (Before Coding)

### 1. Contact Glide Support [REQUIRED]

**Copy-paste this email:**

```
Subject: ERC-4337 Smart Account Compatibility Question

Hi Glide team,

We're integrating Glide for cross-chain deposits to Base. Our users have
smart contract wallets (ERC-4337 account abstraction) created by Porto SDK.

Questions:
1. Does Glide support deposits to smart contract addresses as recipients?
2. Are there any chains where this is restricted?
3. How does Glide handle undeployed contracts (CREATE2 addresses)?

Our smart account details:
- Chain: Base (8453)
- Standard: ERC-4337
- Provider: Porto SDK (Ithaca)
- Address: Deterministic via CREATE2
- Code: https://github.com/portoxyz

Can you confirm deposits to smart accounts work correctly?

Thanks,
Villa Team
security@villa.cash
```

**Send to:** support@buildwithglide.com or via Glide dashboard

**Expected Response Time:** 1-2 business days

**Decision Matrix:**

| Glide Response | Action |
|----------------|--------|
| "Yes, fully supported" | ✅ Proceed with implementation |
| "Yes, but only after deployment" | ⚠️ Add pre-deployment step |
| "No, EOAs only" | 🛑 Find alternative solution |
| "Unknown, needs testing" | 🧪 Test on Base Sepolia first |

---

## P0 Tasks (Must Complete Before Production)

### Task 1: Secure Address Binding [~1 hour]

**File:** `/apps/web/src/lib/glide.ts`

**Add function:**

```typescript
import { checkExistingAccount } from './porto'

/**
 * Securely gets Glide config with atomic address binding
 * Prevents address tampering attacks
 */
export async function getSecureGlideConfig(): Promise<GlideConfig> {
  // Atomic: read address directly from Porto, not localStorage
  const portoAddress = await checkExistingAccount()

  if (!portoAddress) {
    throw new Error('No Porto account connected')
  }

  // Validate format (defense in depth)
  if (!/^0x[a-fA-F0-9]{40}$/.test(portoAddress)) {
    throw new Error('Invalid Porto address format')
  }

  return {
    projectId: GLIDE_PROJECT_ID,
    recipient: portoAddress,
    destinationChainId: 8453,
    theme: villaGlideTheme,
  }
}
```

**Usage in components:**

```typescript
// BEFORE (vulnerable)
const config = getGlideConfig(userAddress)

// AFTER (secure)
const config = await getSecureGlideConfig()
```

**Test:** Already covered by `/apps/web/tests/security/funding-security.spec.ts` lines 74-131

---

### Task 2: Enhanced Error Sanitization [~1 hour]

**File:** `/apps/web/src/lib/glide.ts`

**Add function:**

```typescript
/**
 * Sanitizes Glide error messages to prevent information disclosure
 * Removes: private keys, emails, credit cards, API keys, file paths
 */
export function sanitizeGlideError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unknown error occurred'
  }

  // Get user-friendly message first
  const friendlyMessage = getErrorMessage(error)

  // If using fallback (unknown error), sanitize raw message
  if (friendlyMessage === GLIDE_ERROR_MESSAGES.default) {
    return error.message
      .replace(/0x[a-fA-F0-9]{64}/g, '[REDACTED]') // Private keys
      .replace(/\b[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]') // Emails
      .replace(/\b\d{16,19}\b/g, '[CARD]') // Credit cards
      .replace(/\b(api[_-]?key|token|secret)[=:]\s*\S+/gi, '$1=[REDACTED]')
      .replace(/\/[A-Za-z]:[\\\/].+/g, '[PATH]') // File paths
      .slice(0, 200) // Limit length
  }

  return friendlyMessage
}
```

**Usage in error handlers:**

```typescript
// BEFORE
onError={(error) => toast.error(error.message)}

// AFTER
onError={(error) => toast.error(sanitizeGlideError(error))}
```

**Test:** Already covered by `/apps/web/tests/security/funding-security.spec.ts` lines 383-460

---

### Task 3: Base Sepolia Integration Test [~2 hours]

**Prerequisites:**
- Glide confirms smart account support
- Base Sepolia testnet tokens

**Test Steps:**

```bash
# 1. Create fresh Porto account on staging
npm run dev
# Go to https://localhost:3000/onboarding
# Create new Villa ID
# Copy address: 0x...

# 2. Fund source wallet (Ethereum Sepolia)
# Get Sepolia ETH from faucet: https://sepoliafaucet.com
# Send to your MetaMask

# 3. Integrate Glide widget (use staging Glide project ID)
# Add "Add Funds" button
# Click button → select Ethereum Sepolia → USDC → enter amount

# 4. Complete deposit
# Sign transaction in MetaMask
# Wait for bridge (2-5 minutes)

# 5. Verify receipt on Base Sepolia
# Check Base Sepolia explorer: https://sepolia.basescan.org/address/0x...
# Confirm USDC balance increased
```

**Expected Result:**
✅ Funds arrive at Porto smart account address
✅ No errors during bridge process
✅ Transaction shows on Base Sepolia explorer

**If Test Fails:**
1. Check Glide support response (do they support smart accounts?)
2. Check if Porto contract is deployed (may need pre-deployment)
3. Contact Glide with transaction hash for debugging

---

## P1 Tasks (Before Production)

### Task 4: CSP Headers [~30 minutes]

**File:** `/apps/web/next.config.js`

```javascript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "frame-src 'self' https://*.buildwithglide.com", // ← Add Glide
      "connect-src 'self' https://*.buildwithglide.com https://id.porto.sh",
      "worker-src 'self' blob:",
    ].join('; '),
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

**Test:**
```bash
curl -I https://staging.villa.cash | grep -i content-security-policy
# Should see: frame-src ... buildwithglide.com
```

---

### Task 5: Legal Documentation [~1 day]

**File:** Terms of Service

**Add section:**

```markdown
## Third-Party Services

Villa uses Glide (buildwithglide.com) to provide cross-chain deposit
functionality. When you use the "Add Funds" feature:

- Your destination address (Villa ID) is shared with Glide
- Glide executes bridge transactions on your behalf
- Glide's Terms of Service apply to bridge transactions
- Villa is not responsible for Glide service outages or failures

See Glide's Terms: https://buildwithglide.com/terms
```

**File:** Privacy Policy

**Add section:**

```markdown
## Data Shared with Third Parties

When you use cross-chain deposits, we share:
- Your Villa address (public blockchain address) with Glide
- Transaction metadata (amount, token, source chain) with Glide

We do NOT share:
- Your display name
- Your email (if provided)
- Your passkey credentials
- Your browsing history

Glide's Privacy Policy: https://buildwithglide.com/privacy
```

---

### Task 6: Verify Widget Isolation [~30 minutes]

**During integration testing:**

1. Open DevTools → Elements tab
2. Find Glide widget element
3. Inspect iframe:
   ```html
   <iframe src="https://api.buildwithglide.com/widget/..."
           sandbox="allow-scripts allow-same-origin">
   ```
4. Verify different origin (cross-origin storage isolation)
5. Check `sandbox` attribute (security restrictions)

**Document findings:**

```markdown
## Glide Widget Isolation

- Implementation: iframe with src="https://api.buildwithglide.com/..."
- Origin: Cross-origin (different domain)
- Sandbox: [list attributes]
- Storage Isolation: ✅ Enforced by browser same-origin policy
- Villa localStorage: ✅ Not accessible from Glide iframe
```

**Add to:** `/specs/active/cross-chain-deposits-security.md` Section 5.3

---

## Testing Checklist

Before merging to main:

- [ ] All security tests pass (`pnpm test:security`)
- [ ] `getSecureGlideConfig()` implemented and tested
- [ ] `sanitizeGlideError()` implemented and tested
- [ ] Base Sepolia integration test successful (funds received)
- [ ] CSP headers configured and tested
- [ ] Legal docs updated (Terms + Privacy)
- [ ] Widget isolation verified and documented
- [ ] Glide support confirms smart account compatibility

---

## Deployment Checklist

Before production launch:

- [ ] Glide production project ID configured
- [ ] villa.cash domain allowlisted in Glide dashboard
- [ ] Porto smart accounts work on Base mainnet (test with small amount)
- [ ] CSP headers deployed to production
- [ ] Terms of Service live with Glide disclosure
- [ ] Privacy Policy live with data sharing disclosure
- [ ] Monitoring configured (deposit success/failure rates)
- [ ] Incident response plan documented
- [ ] Support team briefed on Glide integration

---

## Risk Assessment After Mitigation

| Risk | Before | After | Mitigated By |
|------|--------|-------|--------------|
| Address tampering | MEDIUM | LOW | `getSecureGlideConfig()` |
| Error info leak | MEDIUM | LOW | `sanitizeGlideError()` |
| Smart account incompatible | HIGH | LOW | Glide verification + testing |
| CSP blocks widget | LOW | VERY LOW | CSP headers configured |
| Storage isolation | LOW | VERY LOW | Documented + browser-enforced |

**Overall Risk:** LOW (acceptable for production)

---

## Timeline Estimate

| Task | Time | Blocker |
|------|------|---------|
| Contact Glide support | 15 min | - |
| Wait for Glide response | 1-2 days | BLOCKING |
| Implement secure binding | 1 hour | Glide response |
| Implement error sanitization | 1 hour | - |
| Configure CSP | 30 min | - |
| Update legal docs | 1 day | Legal team |
| Base Sepolia test | 2 hours | Glide response |
| Verify widget isolation | 30 min | Integration complete |
| **TOTAL** | **2-3 days** | Glide response |

---

## Decision: Go or No-Go?

**Recommendation:** ✅ PROCEED with implementation **IF** Glide confirms smart account support.

**Justification:**
1. Security review complete (no critical vulnerabilities found)
2. Test suite comprehensive (32 tests, >90% coverage)
3. Mitigations identified and documented
4. Risk level acceptable (LOW) after mitigations

**Next Step:** Send email to Glide support **TODAY**.

While waiting for response (1-2 days), implement Tasks 1-2 and 4-5 (they're independent of Glide response).

---

**Questions?** Check:
- Full audit: `/specs/active/cross-chain-deposits-audit-report.md`
- Security analysis: `/specs/active/cross-chain-deposits-security.md`
- Feature spec: `/specs/active/cross-chain-deposits.md`
- Test file: `/apps/web/tests/security/funding-security.spec.ts`
