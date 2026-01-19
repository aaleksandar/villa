# Cross-Chain Deposits via Glide

**Status:** Draft  
**Created:** 2026-01-08  
**Priority:** P1 (Post-mainnet enhancement)  
**Author:** @spec agent  

---

## Goal

Enable Villa users to fund their Base address from ANY chain (Ethereum, Arbitrum, Optimism, Polygon, etc.) with a single click, using Glide's pre-built deposit widget.

---

## Why Glide (Not Native Bridges or Custom Solution)

**Alternatives considered:**

- **Native bridges (Base Bridge, Hop, etc.):** Multiple steps for users (approve, bridge, wait, check destination), each chain requires separate integration, users must hold gas on source chain. Poor UX for non-crypto-natives.

- **Custom aggregator integration (LI.FI, Socket, etc.):** Full control but massive scope: quote APIs, route selection, transaction building, status tracking, error handling. 2-3 months of work for MVP.

- **Manual instructions ("send from exchange"):** Zero development but terrible UX. Users get confused, send to wrong addresses, lose funds.

**Chosen approach:** Glide SDK
1. **One-step UX** - No bridges, no swaps, no multi-step approvals
2. **Exchange support** - Users can deposit directly from Coinbase/Binance
3. **Gas abstraction** - Users don't need native tokens on source chain
4. **Pre-built widget** - Ship in days, not months
5. **Multi-chain coverage** - 10+ chains supported out of the box
6. **Fee transparency** - All costs shown upfront before confirmation

---

## User Experience

### Primary Flow: Fund from Any Chain

**Entry point:** Home page "Add Funds" button or Settings > Fund Wallet

1. **User taps "Add Funds"** on home screen
2. **Glide widget opens** (bottom sheet on mobile)
3. **User selects source:**
   - Connect existing wallet (MetaMask, Rainbow, etc.)
   - OR paste address from exchange
4. **User selects amount and token** (USDC, ETH, etc.)
5. **Fee breakdown shown** (Glide fee + gas)
6. **User confirms** in their source wallet
7. **Progress indicator** shows transaction status
8. **Success!** Funds arrive on Base

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| User has no external wallet | Show "Buy crypto" option (Glide onramp) |
| Transaction fails | Show error + retry option with same params |
| User cancels mid-flow | Return to home, no state change |
| Low balance on source | Glide shows insufficient funds warning |
| Unsupported token | Token not shown in selection |

---

## UI Boundaries

**Villa controls:**
- Entry point UI (button on home/settings)
- Success/error messaging after transaction
- Transaction history display (future)
- Villa theming passed to Glide widget

**Glide widget controls (security-critical):**
- Wallet connection flow
- Token/chain selection UI
- Amount input and validation
- Fee calculation and display
- Transaction signing prompts
- Transaction status tracking
- Error handling during transaction

We can customize Glide's colors via theme config but CANNOT replace transaction-critical UI elements.

---

## Language Guidelines

| Internal/Tech | User-Facing |
|---------------|-------------|
| Cross-chain bridge | Add Funds |
| Glide SDK | (hidden - infrastructure) |
| Source chain | "From" |
| Destination (Base) | "To Villa" or "To your Villa ID" |
| Recipient address | (hidden - auto-filled) |
| Payment session | (hidden - internal) |
| Relayer fee | "Network fee" |

**Rule:** Users should never see "bridge", "cross-chain", or technical chain IDs. The mental model is "add funds to my Villa account."

---

## Technical Approach

### Dependencies

```json
{
  "@paywithglide/glide-react": "^0.0.44"
}
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_GLIDE_PROJECT_ID=villa-xyz

# Optional (for analytics)
GLIDE_API_KEY=sk_...
```

### Integration Pattern

Glide provides two integration modes:

1. **Widget Mode (Recommended for v1):**
   ```typescript
   // Use the pre-built hook
   const { openGlideDeposit } = useGlideDeposit({
     projectId: 'villa',
     recipient: userAddress, // Porto smart account address
     destinationChainId: 8453, // Base mainnet
     theme: villaGlideTheme,
   })
   ```

2. **Headless Mode (Future v2):**
   - Build custom UI on top of Glide APIs
   - Full control over UX
   - More development effort

### Component Structure

```
apps/web/src/
  components/
    funding/
      AddFundsButton.tsx      # Entry point button
      GlideDepositModal.tsx   # Wrapper with Villa chrome
  lib/
    glide.ts                  # Glide config and theme
```

### Theme Configuration

Match Villa's design system:

```typescript
const villaGlideTheme = {
  colors: {
    primary: '#2563eb',        // villa-500
    primaryHover: '#1d4ed8',   // villa-600
    background: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    error: '#ef4444',
    success: '#22c55e',
  },
  borderRadius: {
    button: '8px',
    card: '12px',
    modal: '16px',
  },
  fontFamily: 'system-ui, sans-serif',
}
```

### Data Flow

```
User taps "Add Funds"
        │
        ▼
┌───────────────────┐
│  GlideDepositModal │
│  (Villa wrapper)   │
└─────────┬─────────┘
          │ Opens
          ▼
┌───────────────────┐
│   Glide Widget    │ ← Handles wallet connect, token select,
│   (iframe/modal)  │   fee calc, tx signing, status
└─────────┬─────────┘
          │ Complete
          ▼
┌───────────────────┐
│  Villa Success    │ ← Show confirmation, update UI
│  Screen           │
└───────────────────┘
```

### State Management

Glide manages internal state. Villa tracks:

```typescript
interface FundingState {
  isModalOpen: boolean
  lastTransaction?: {
    txHash: string
    amount: string
    token: string
    sourceChain: string
    timestamp: number
  }
}
```

### Error Handling

| Error | User Message | Action |
|-------|--------------|--------|
| Glide unavailable | "Funding temporarily unavailable" | Show contact support |
| Network error | "Connection lost. Please retry." | Retry button |
| Transaction rejected | "Transaction cancelled" | Close modal |
| Transaction failed | "Transaction failed: [reason]" | Retry with same params |

---

## Tasks

### P0: MVP Integration (Week 1)

1. **Setup Glide SDK**
   - Install `@paywithglide/glide-react`
   - Create Glide project, get project ID
   - Add env vars to staging/production

2. **Create AddFundsButton component**
   - Button with Glide deposit trigger
   - Pass user's Porto address as recipient
   - Villa-themed wrapper

3. **Add to Home Page**
   - "Add Funds" button below profile card
   - Only show when user is authenticated

4. **E2E Test (mock)**
   - Test button renders
   - Test modal opens (mocked Glide)
   - Test success callback fires

### P1: Polish (Week 2)

5. **Success State Enhancement**
   - Show confirmation with amount
   - Link to block explorer

6. **Settings Page Entry Point**
   - Add "Fund Wallet" option to settings

7. **Mobile Optimization**
   - Test on iOS Safari, Android Chrome
   - Ensure touch targets meet 44px minimum

### P2: Future Enhancements

8. **Transaction History**
   - Store completed deposits in local storage
   - Show recent deposits on home page

9. **Headless Integration**
   - Custom UI for deposit flow
   - Better animation control

10. **Notification on Complete**
    - Push notification when funds arrive

---

## Acceptance Criteria

### P0 (Must have for launch)

- [ ] User can tap "Add Funds" on home page
- [ ] Glide widget opens with user's Base address pre-filled
- [ ] Widget displays available source chains and tokens
- [ ] User can complete deposit from another wallet
- [ ] Success state shows in Villa UI after completion
- [ ] Error states are handled gracefully
- [ ] Works on mobile Safari and Chrome

### P1 (Should have)

- [ ] Villa theming applied to Glide widget
- [ ] Entry point also available in Settings
- [ ] Block explorer link shown on success
- [ ] Animation on success (Lottie celebration)

### P2 (Nice to have)

- [ ] Transaction history visible
- [ ] Copy "receive address" option
- [ ] QR code for receive address

---

## Session and UX Patterns

### Glide Session Behavior

| Component | TTL | Notes |
|-----------|-----|-------|
| Glide payment session | ~15 min | Created per deposit flow |
| Wallet connection | Session | Persists in Glide widget |
| Transaction status | Until confirmed | Glide polls automatically |

### Copy Standards

| Action | Button Text | Helper Text |
|--------|-------------|-------------|
| Open deposit | "Add Funds" | "Deposit from any chain" |
| Confirm | (Glide controls) | - |
| Success | "Done" | "Funds will arrive in ~2 minutes" |
| Error | "Try Again" | "[Specific error message]" |

### What We Cannot Control

- Glide's internal wallet connection UI
- Fee amounts (set by Glide/relayers)
- Transaction confirmation times
- Source chain gas prices
- Token availability per chain

---

## Security Considerations

### User Protection

- **Address validation:** Glide validates recipient is valid EVM address
- **No private key exposure:** User signs on source chain with their wallet
- **Fee transparency:** All costs shown before confirmation
- **Recipient locked:** User cannot change destination address (it's their Villa ID)

### Integration Security

- **Project ID:** Public, safe to expose in frontend
- **API Key:** Server-side only, for analytics (not required for widget)
- **Origin allowlist:** Configure Glide dashboard with villa.cash domains
- **No sensitive data:** Villa doesn't store any deposit data on our servers

### Trust Model

```
User trusts:
  1. Their source wallet (MetaMask, etc.) to sign correctly
  2. Glide to execute the bridge transaction
  3. Villa to display their correct recipient address

Villa trusts:
  1. Glide to deliver funds to specified address
  2. Porto to maintain correct user addresses
```

---

## Out of Scope (v1)

- **On-ramp (fiat to crypto):** Glide supports this but adds KYC complexity. Deferred.
- **Off-ramp (crypto to fiat):** Not in Glide's current offering for our integration.
- **Send/transfer to others:** This is deposit only, not general send.
- **Scheduled/recurring deposits:** Manual only for v1.
- **Custom slippage settings:** Use Glide defaults.
- **Advanced routing options:** Trust Glide's optimal routing.

---

## Dependencies and Blockers

### Required Before Implementation

- [ ] Glide project created (signup at buildwithglide.com)
- [ ] Project ID received
- [ ] Staging environment set up

### Required Before Production

- [ ] Production Glide project ID
- [ ] Domain allowlisted in Glide dashboard
- [ ] Mainnet deploy complete (Base address must be valid on mainnet)

### Not Required (Glide handles)

- Multi-chain RPC endpoints
- Bridge protocol integrations
- Gas estimation logic
- Transaction status polling

---

## Monitoring and Analytics

### Key Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Widget open rate | Track | Users who tap Add Funds |
| Completion rate | >60% | Users who complete deposit |
| Average deposit | Track | $ value of deposits |
| Error rate | <5% | Failed transactions |

### Events to Track

```typescript
// Villa analytics (Plausible/Mixpanel)
'funding_widget_opened'
'funding_deposit_started'    // source chain, token
'funding_deposit_completed'  // amount, source chain, token
'funding_deposit_failed'     // error type
'funding_widget_closed'      // without completing
```

---

## References

- [Glide Documentation](https://docs.buildwithglide.com)
- [Glide Supported Chains](https://docs.buildwithglide.com/resources/supported-chains-and-tokens/)
- [@paywithglide/glide-react](https://www.npmjs.com/package/@paywithglide/glide-react)
- [Glide Demo](https://demo.buildwithglide.com/)
- [Villa Design System](/specs/reference/design-system.md)
- [Villa Home Page](/apps/web/src/app/home/page.tsx)

---

## Appendix: Glide Supported Chains

Based on documentation research, Glide supports deposits from:

**Source Chains (deposit FROM):**
- Ethereum Mainnet
- Base
- Arbitrum
- Optimism
- Polygon
- Avalanche
- BNB Chain
- And more (check docs for full list)

**Destination:** Base (Villa's target chain)

**Tokens:** USDC, USDT, ETH, and chain-native tokens (varies by source)

---

*Last updated: 2026-01-08*
