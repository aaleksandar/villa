# Future: Passkey Domain Ownership Investigation

> Status: Research needed
> Priority: Future enhancement
> Related: Porto SDK integration

## Current Architecture

Currently, Villa uses Porto SDK for the entire passkey flow:
- Passkeys are created under Porto's domain (id.porto.sh)
- Smart accounts are deployed by Porto's relayer
- Villa wraps Porto with custom theming and UX

## Investigation Goal

Explore whether passkeys can be owned by `villa.cash` domain directly, using Porto only for:
- Smart contract interactions
- Relayer services
- Account recovery

## Benefits of Domain Ownership

1. **Brand consistency**: Passkeys show "villa.cash" instead of "porto.sh"
2. **User trust**: Users see Villa branding in system dialogs
3. **Portability**: Less dependency on Porto's infrastructure
4. **Privacy**: Villa-owned passkeys don't share data with Porto

## Technical Considerations

### WebAuthn RP ID
- Relying Party ID determines passkey ownership
- Currently: `id.porto.sh`
- Target: `villa.cash`

### What Porto Provides
1. **Porto Account contracts** - Still needed for account abstraction
2. **Bundler/Relayer** - Still needed for gas sponsorship
3. **WebAuthn signature verification** - Reusable on-chain

### What Would Change
1. **Passkey creation** - Direct WebAuthn API calls
2. **Passkey storage** - In user's device, tied to villa.cash
3. **Authentication UI** - Fully custom Villa experience

## Research Tasks

1. Review Porto SDK source for WebAuthn implementation
2. Understand what can be customized vs. required
3. Check if Porto supports custom RP ID
4. Evaluate effort vs. benefit
5. Consider hybrid approach

## Links

- [Porto SDK](https://porto.sh/sdk)
- [WebAuthn spec](https://www.w3.org/TR/webauthn-2/)
- [Porto GitHub](https://github.com/ithacaxyz/porto)

## Notes

This is a significant architectural decision. Benefits must outweigh:
- Implementation complexity
- Security audit requirements
- Maintenance burden
- Porto relationship considerations
