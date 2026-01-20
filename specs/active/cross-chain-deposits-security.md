# Cross-Chain Deposits Security Review

**Status:** Security Analysis
**Created:** 2026-01-08
**Reviewer:** Claude Solidity Agent
**Related Spec:** `cross-chain-deposits.md`

---

## Executive Summary

**Overall Risk Level:** LOW-MEDIUM

Cross-chain deposits via Glide SDK present **minimal new attack surface** for Villa. The primary security concerns center around:

1. **Smart Contract Account Compatibility** - Porto creates ERC-4337 smart accounts, not EOAs
2. **Trust Model** - Three-party trust relationship (User → Glide → Base)
3. **Frontend Security** - Address validation and XSS prevention
4. **Transaction Handling** - Error states and failure modes

**Key Finding:** Glide SDK operates as a **black box widget** - Villa cannot inspect or modify transaction logic. Security relies on Glide's implementation and Porto's smart account compatibility.

---

## 1. Smart Contract Account Compatibility

### Overview

Porto creates **smart contract wallets** (ERC-4337 account abstraction), not traditional EOAs:

```
Porto Architecture:
├── WebAuthn Passkey (authentication)
├── EIP-7702 Delegated Code (upgrade EOA → smart account)
├── Smart Account Contract (receives funds)
└── Bundler/Relayer (submits transactions)
```

### Risk Assessment

| Risk | Severity | Likelihood | Impact |
|------|----------|------------|--------|
| Glide doesn't support smart contract recipients | MEDIUM | LOW | Deposits fail silently |
| Chain-specific restrictions on contract recipients | LOW | LOW | Some chains may reject |
| Gas estimation failures for contract calls | LOW | MEDIUM | Transaction reverts |

### Evidence from Codebase

From `/Users/me/Documents/Coding/villa/apps/web/src/lib/porto.ts` (lines 191-252):

```typescript
// Porto uses relay mode with villa.cash keystoreHost
// This binds passkeys to Villa's domain but still uses Porto's
// smart account contracts on Base

export function getPortoRelay(): ReturnType<typeof Porto.create> {
  return Porto.create({
    mode: Mode.relay({
      keystoreHost: VILLA_KEYSTORE_HOST, // 'villa.cash' in prod
      // ... WebAuthn handlers
    }),
  })
}
```

**Porto Smart Account Characteristics:**
- Address is deterministically derived from passkey public key
- Contract is deployed on first transaction (CREATE2)
- Supports receiving ETH, ERC-20, ERC-721, ERC-1155
- No special restrictions on incoming transfers

### Glide Compatibility Check

**ACTION REQUIRED:** Before implementation, verify with Glide:

```bash
# Test queries for Glide support team
1. "Does Glide SDK support deposits to smart contract addresses (ERC-4337)?"
2. "Are there any chains where contract recipients are restricted?"
3. "How does Glide handle gas estimation for undeployed smart accounts?"
4. "What happens if the recipient contract is not yet deployed?"
```

**Expected Answer:** Glide should support smart contract recipients since:
- Base network fully supports ERC-4337
- Smart accounts are standard recipients on EVM
- Glide uses standard `eth_sendTransaction` which works for contracts

### Mitigation: Pre-Deploy Smart Accounts

If Glide has issues with undeployed contracts, Villa can pre-deploy:

```typescript
// In createAccountHeadless() or signInHeadless()
async function ensureAccountDeployed(address: string): Promise<void> {
  const porto = getPortoRelay()

  // Check if contract is deployed
  const code = await provider.getCode(address)

  if (code === '0x') {
    // Deploy by executing a zero-value self-transfer
    await porto.provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: address,
        to: address,
        value: '0x0',
      }],
    })
  }
}
```

---

## 2. Cross-Chain Security Model

### Trust Model

```
User Trust Chain:
1. User → Vila UI (address display is correct)
2. User → Glide Widget (transaction execution is honest)
3. Glide → Source Chain (user's wallet signs correctly)
4. Glide → Bridge Protocol (funds are relayed)
5. Bridge → Base Network (funds arrive at correct address)
```

### Attack Vectors

#### 2.1 Address Spoofing (CRITICAL)

**Scenario:** Malicious code replaces recipient address before passing to Glide

**Vulnerable Code Pattern:**
```typescript
// BAD - address could be tampered with
let userAddress = getUserAddress()
// ... some other code ...
openGlideDeposit({ recipient: userAddress }) // Is this still the user's address?
```

**Mitigation:** Use immediate address binding

```typescript
// GOOD - atomic operation
const { openGlideDeposit } = useGlideDeposit({
  recipient: checkExistingAccount(), // Direct from Porto
  destinationChainId: 8453,
})
```

**Test Coverage Required:**
- Verify recipient address matches Porto-derived address
- Test that address cannot be modified via localStorage tampering
- Ensure address is passed to Glide in single atomic operation

#### 2.2 Fee Manipulation

**Scenario:** Glide displays incorrect fees to user

**Risk:** LOW - Glide controls fee UI, Villa cannot override

**Mitigation:**
- User sees fees in Glide widget (transparency)
- Document in user flow that fees are set by Glide
- No way for Villa to manipulate fees (out of scope)

#### 2.3 Transaction Front-Running

**Scenario:** Malicious relayer observes pending deposit and front-runs

**Risk:** LOW - Bridge transactions are atomic, no MEV opportunity

**Rationale:**
- Glide uses intent-based architecture (user signs destination address)
- Recipient address is cryptographically bound in signature
- No way for relayer to change destination mid-flight

#### 2.4 Phishing via Fake Widget

**Scenario:** Attacker serves fake Glide widget to steal funds

**Risk:** MEDIUM - Villa loads Glide via npm package

**Mitigation:**
- Use npm package from official `@paywithglide` org
- Enable Subresource Integrity (SRI) if Glide uses CDN
- Implement Content Security Policy (CSP)

```typescript
// In next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      frame-src 'self' https://api.buildwithglide.com;
      connect-src 'self' https://api.buildwithglide.com;
    `.replace(/\s+/g, ' '),
  },
]
```

---

## 3. Frontend Security

### 3.1 Address Validation

**Current Implementation:** `/Users/me/Documents/Coding/villa/apps/web/src/lib/validation.ts` (line 59)

```typescript
address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address')
```

**Status:** SECURE - Validates strict EVM address format

**Additional Check Required:**
```typescript
// Verify address matches Porto-derived address
function validatePortoAddress(address: string): boolean {
  const portoAddress = await checkExistingAccount()
  return address.toLowerCase() === portoAddress?.toLowerCase()
}
```

### 3.2 XSS Prevention

**Existing Protections:** `/Users/me/Documents/Coding/villa/apps/web/tests/security/comprehensive.spec.ts`

Villa has comprehensive XSS tests:
- Input sanitization (lines 4-21 in validation.ts)
- Display name escaping
- No eval() or innerHTML usage
- CSP headers

**Glide Widget Isolation:**
- Glide renders in iframe or shadow DOM (verify this)
- Villa only passes primitive values (strings, numbers)
- No user-generated content passed to Glide

**Test Required:**
```typescript
test('Glide widget cannot access Villa localStorage', async () => {
  // Set sensitive data
  localStorage.setItem('villa-identity', '...')

  // Open Glide widget
  openGlideDeposit({ recipient: '0x...' })

  // Verify Glide iframe cannot read localStorage
  // (This is enforced by browser same-origin policy)
})
```

### 3.3 Transaction Data Sanitization

**Risk:** User-facing messages from Glide could contain XSS

**Example Vulnerable Code:**
```typescript
// BAD - if Glide returns HTML in error message
<div dangerouslySetInnerHTML={{ __html: glideError.message }} />
```

**Secure Pattern:**
```typescript
// GOOD - always escape user-facing text
<div>{glideError.message}</div> // React auto-escapes

// Or use DOMPurify if you must render HTML
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(glideError.message)
}} />
```

---

## 4. Error Handling Security

### 4.1 Information Disclosure

**Risk:** Error messages leak sensitive info (API keys, internal addresses)

**Current Protections:** `/Users/me/Documents/Coding/villa/apps/web/tests/security/comprehensive.spec.ts` (lines 741-789)

```typescript
test('error messages do not leak sensitive info', async ({ page }) => {
  // Checks for:
  // - File system paths (/Users/..., C:\...)
  // - API keys (api_key, token patterns)
  // - Long hex strings (private keys)
})
```

**Glide-Specific Check Required:**
```typescript
// Sanitize Glide errors before displaying
function sanitizeGlideError(error: unknown): string {
  if (error instanceof Error) {
    // Remove potential PII or sensitive data
    return error.message
      .replace(/0x[a-fA-F0-9]{64}/g, '[REDACTED]') // Private keys
      .replace(/\b[\w-]+@[\w-]+\.[\w-]+/g, '[EMAIL]') // Emails
      .replace(/\b\d{16,19}\b/g, '[CARD]') // Credit cards
  }
  return 'An unknown error occurred'
}
```

### 4.2 Transaction Failure Recovery

**Scenario:** Glide transaction fails mid-flight, user's funds stuck

**Villa's Responsibility:**
- Display clear error message
- Provide retry option
- Link to block explorer for on-chain verification
- Support contact for unresolved issues

**Out of Scope for Villa:**
- Transaction recovery (Glide handles)
- Refunds (Glide handles)
- Bridge protocol failures (Glide handles)

---

## 5. Data Privacy

### 5.1 What Villa Sees

```
Villa Access:
├── User's Base address (from Porto)
├── Glide widget open/close events
└── Success/failure callbacks

Villa DOES NOT See:
├── Source wallet address
├── Source chain selection
├── Token amounts
├── Transaction signatures
└── Private keys (obviously)
```

### 5.2 What Glide Sees

```
Glide Access:
├── Recipient address (Villa's user address)
├── Destination chain (Base)
├── Source wallet (user connects)
├── Transaction details (amount, token)
└── User IP address (for geo-compliance)
```

**Privacy Consideration:** User must trust Glide with transaction metadata

**Mitigation:**
- Disclose in UI: "Powered by Glide - see their privacy policy"
- Link to Glide's privacy policy
- Document in Villa's privacy policy

### 5.3 Storage Security

**Villa Storage (localStorage):**
- `villa-identity`: Contains user address (public, no PII)
- `porto-*`: Porto session tokens (cleared on logout)

**Glide Storage:**
- Unknown (Glide SDK manages own storage)
- Likely stores wallet connection state
- Verify: Does Glide clear storage on widget close?

**Test Required:**
```typescript
test('Glide does not persist user data after widget close', async () => {
  // Open widget, connect wallet, close
  openGlideDeposit(...)
  // ... user completes flow ...
  closeWidget()

  // Check localStorage for Glide keys
  const glideKeys = Object.keys(localStorage).filter(k =>
    k.includes('glide') || k.includes('paywithglide')
  )

  expect(glideKeys).toHaveLength(0) // Or document which keys are expected
})
```

---

## 6. Smart Contract Risks

### 6.1 Porto Smart Account Vulnerabilities

**Current Status:** Porto contracts are:
- Audited by Ithaca (Foundry/Viem creators)
- Open source (MIT license)
- Battle-tested in production

**Villa's Exposure:**
- Villa does not deploy or modify Porto contracts
- Villa uses Porto as-is via SDK
- Any Porto vulnerability affects Villa users

**Mitigation:**
- Monitor Porto's GitHub for security advisories
- Subscribe to Porto's security mailing list (if available)
- Have incident response plan for Porto vulnerabilities

### 6.2 Glide Bridge Contract Risks

**Villa's Exposure:** MINIMAL
- Villa doesn't interact with bridge contracts directly
- Glide SDK abstracts all bridge logic
- Bridge security is Glide's responsibility

**Due Diligence Required:**
- Review Glide's audit reports (request from Glide)
- Check if Glide uses established bridges (Axelar, LayerZero, etc.)
- Understand Glide's insurance/recovery process

---

## 7. Compliance and Regulatory

### 7.1 AML/KYC Requirements

**Glide's Responsibility:**
- Glide likely performs KYC for large transactions
- Glide blocks sanctioned addresses (OFAC compliance)
- Villa does not see or process fiat

**Villa's Responsibility:**
- Terms of Service must disclose third-party dependency
- Privacy Policy must mention Glide data sharing

### 7.2 Jurisdictional Restrictions

**Scenario:** User in restricted jurisdiction tries to use Glide

**Glide's Behavior:**
- Likely blocks based on IP geolocation
- Shows error in widget

**Villa's Behavior:**
- Display error message from Glide
- Optionally show alternative funding methods (exchange deposit)

---

## 8. Test Requirements

### 8.1 Unit Tests

```typescript
// apps/web/tests/unit/glide-integration.test.ts

describe('Glide Address Validation', () => {
  it('rejects non-matching recipient address', () => {
    const userAddress = '0x1234...'
    const wrongAddress = '0x5678...'

    expect(() => {
      validateGlideRecipient(wrongAddress, userAddress)
    }).toThrow('Recipient address mismatch')
  })

  it('validates ERC-4337 smart account address', () => {
    const smartAccountAddress = getPortoSmartAccountAddress()
    expect(isValidAddress(smartAccountAddress)).toBe(true)
  })
})
```

### 8.2 Integration Tests

```typescript
// apps/web/tests/integration/glide-flow.test.ts

describe('Glide Deposit Flow', () => {
  it('displays correct recipient address to user', () => {
    const address = getUserAddress()
    renderAddFundsButton()

    // Verify address shown in UI matches Porto address
    expect(screen.getByText(address)).toBeInTheDocument()
  })

  it('handles Glide widget close without completion', () => {
    openGlideDeposit()
    simulateWidgetClose()

    // Verify no side effects (state unchanged)
    expect(getTransactionHistory()).toHaveLength(0)
  })
})
```

### 8.3 E2E Security Tests

See: `/Users/me/Documents/Coding/villa/apps/web/tests/security/funding-security.spec.ts` (to be created)

```typescript
// apps/web/tests/security/funding-security.spec.ts

describe('Funding Security', () => {
  it('prevents address tampering via localStorage', () => {
    // Attacker tries to change recipient address
    localStorage.setItem('glide-recipient', 'attacker-address')

    // Open widget
    openGlideDeposit({ recipient: userAddress })

    // Verify correct address is used
    expect(glideConfig.recipient).toBe(userAddress)
  })

  it('Glide widget cannot access Villa session data', () => {
    // Set sensitive data
    localStorage.setItem('porto-session', 'secret')

    // Open Glide widget
    const widget = openGlideDeposit()

    // Verify widget is sandboxed (iframe or shadow DOM)
    expect(widget.canAccessParentStorage).toBe(false)
  })

  it('sanitizes error messages from Glide', () => {
    const error = new Error('Transaction failed: privateKey=0xdeadbeef...')

    const sanitized = sanitizeGlideError(error)

    expect(sanitized).not.toContain('0xdeadbeef')
    expect(sanitized).toContain('[REDACTED]')
  })
})
```

---

## 9. Deployment Checklist

### Pre-Production

- [ ] Verify Glide supports ERC-4337 smart accounts (contact Glide support)
- [ ] Test deposits to Porto smart account on Base Sepolia
- [ ] Confirm recipient address matches Porto-derived address
- [ ] Test with undeployed smart account (pre-CREATE2)
- [ ] Review Glide's audit reports
- [ ] Add CSP headers for Glide domains
- [ ] Implement error sanitization
- [ ] Write E2E security tests
- [ ] Update Terms of Service (third-party dependency)
- [ ] Update Privacy Policy (Glide data sharing)

### Production

- [ ] Enable Glide production project ID
- [ ] Allowlist villa.cash domain in Glide dashboard
- [ ] Monitor first 10 transactions manually
- [ ] Set up alerts for failed deposits (>5% rate)
- [ ] Document incident response for Glide outages

---

## 10. Mitigations Summary

| Risk | Mitigation | Owner | Status |
|------|------------|-------|--------|
| Smart account compatibility | Verify with Glide, pre-deploy if needed | Villa | REQUIRED |
| Address spoofing | Atomic address binding, validation | Villa | IMPLEMENT |
| XSS in error messages | Sanitize all Glide outputs | Villa | IMPLEMENT |
| Phishing via fake widget | Use official npm package, CSP | Villa | IMPLEMENT |
| Porto contract vulnerability | Monitor advisories, incident plan | Villa | DOCUMENT |
| Glide bridge failure | Display support contact, escalate | Glide | OUT OF SCOPE |
| Transaction metadata privacy | Disclose in privacy policy | Villa | DOCUMENT |

---

## 11. Security Contacts

### Internal
- **Villa Security Lead:** security@villa.cash
- **Incident Response:** [Incident Playbook TBD]

### External
- **Porto Security:** security@ithaca.xyz (or check Porto docs)
- **Glide Support:** support@buildwithglide.com
- **Base Security Council:** [Base Bug Bounty Program]

---

## 12. Recommendations

### P0 (Must Have Before Launch)

1. **Verify Smart Account Support**
   - Contact Glide: "Do you support ERC-4337 smart accounts as recipients?"
   - Test deposit to Porto smart account on testnet
   - Document result in this spec

2. **Implement Address Validation**
   - Add `validateGlideRecipient()` function
   - Ensure atomic binding from Porto → Glide
   - Write unit tests

3. **Write Security Tests**
   - Create `funding-security.spec.ts` (see Section 8.3)
   - Add to `pnpm test:security` suite
   - Ensure coverage >90%

### P1 (Should Have)

4. **CSP Headers**
   - Add Glide domains to Content-Security-Policy
   - Test widget loads correctly
   - Test widget is sandboxed

5. **Error Sanitization**
   - Implement `sanitizeGlideError()` utility
   - Apply to all user-facing Glide messages
   - Add tests for PII/sensitive data removal

### P2 (Nice to Have)

6. **Monitoring**
   - Track deposit success/failure rates
   - Alert on >5% failure rate
   - Log (sanitized) errors for debugging

7. **User Education**
   - Add tooltip: "Your Villa address is a smart contract wallet"
   - Link to help article: "What is a smart contract wallet?"

---

## 13. Open Questions

1. **Does Glide widget run in iframe or shadow DOM?**
   - **Impact:** Determines XSS isolation level
   - **Action:** Inspect Glide SDK source or ask Glide team

2. **What happens if Porto smart account is not yet deployed?**
   - **Impact:** Deposits might fail if Glide checks contract code
   - **Action:** Test on testnet with fresh passkey

3. **Does Glide support gas estimation for contract recipients?**
   - **Impact:** Transaction might revert if gas is under-estimated
   - **Action:** Contact Glide support, share Porto contract details

4. **What is Glide's incident response SLA?**
   - **Impact:** How long before deposits are restored after outage?
   - **Action:** Review Glide's service agreement

5. **Does Glide clear storage on widget close?**
   - **Impact:** Potential data leakage between sessions
   - **Action:** Test storage behavior, document findings

---

## 14. Conclusion

**Overall Assessment:** Cross-chain deposits via Glide SDK are **LOW-MEDIUM RISK** for Villa, with acceptable security tradeoffs:

**Acceptable Risks:**
- Trust in Glide's bridge implementation (industry standard)
- Porto smart account compatibility (likely supported, requires verification)
- Transaction metadata visible to Glide (disclosed in privacy policy)

**Unacceptable Risks (Must Mitigate):**
- Address spoofing via frontend tampering → MITIGATE with validation
- XSS in error messages → MITIGATE with sanitization
- Phishing via fake widget → MITIGATE with CSP and official package

**Blockers:**
- Smart account compatibility MUST be verified before production
- Security tests MUST pass before deployment
- Privacy policy MUST be updated

**Next Steps:**
1. Contact Glide support for smart account verification
2. Implement security mitigations (P0 items)
3. Write and run security test suite
4. Update legal documentation
5. Deploy to staging for QA

---

**Document Version:** 1.0
**Last Updated:** 2026-01-08
**Next Review:** Before production deployment
**Security Approval:** PENDING (requires Glide verification)
