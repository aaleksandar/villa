# Villa Identity: zkID + Passkey Integration

**Spec ID:** VISION-002
**Status:** DRAFT
**Created:** 2026-01-20
**Last Updated:** 2026-01-20

**The identity layer for people who live in multiple places, belong to multiple communities, and refuse to choose between privacy and convenience.**

Villa Identity combines zero-knowledge proofs with passkey authentication to give pop-up city residents a single portable credential that works across Zuzalu-style communities worldwide. No seed phrases. No identity fragmentation. Just tap your phone to prove you belong—without revealing who you are.

This document serves as the canonical reference for Villa's zkID integration: reading list for collaborators, product spec for builders, and narrative for communities considering adoption.

---

## Part One: Reading list and essential references

### If you're a developer building on Villa Identity

**Start here (the foundations):**

The Semaphore Protocol paper by Kobi Gurkan et al. explains anonymous group membership proofs—the cryptographic primitive underlying most privacy-preserving identity systems. Read at docs.zkproof.org/pages/standards/accepted-workshop3/proposal-semaphore.pdf. Then explore the V4 implementation at github.com/semaphore-protocol/semaphore (1,000+ stars, battle-tested across 50+ projects including Worldcoin).

**Zupass and PCD framework:**

Zupass documentation at docs.pcd.team covers Proof-Carrying Data architecture—how any claim can be bundled with its own cryptographic proof. The POD (Provable Object Data) format reduces ZK circuit development from 2,000 lines to a few JSON-like declarations. Key packages: `@pcd/pod`, `@pcd/gpc`, `@pcd/semaphore-identity-pcd`. Monorepo at github.com/proofcarryingdata/zupass (355 stars).

**Passkey specifications:**

W3C WebAuthn Level 3 specification at w3c.github.io/webauthn defines the browser API. RIP-7212 at github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md enables **100x gas reduction** for secp256r1 verification—the curve passkeys use. EIP-7702 at eips.ethereum.org/EIPS/eip-7702 (live on mainnet since May 2025) lets EOAs delegate to smart contracts, enabling passkey-signed transactions.

**Porto SDK:**

The reference implementation for EIP-7702 + passkeys at porto.sh/sdk. Built by Ithaca (Paradigm CTO's team, creators of Reth, Foundry, Wagmi). Porto achieves **71% faster execution** than ERC-4337 alternatives with native passkey support.

**Unforgettable (biometric recovery):**

Whitepaper at unforgettable.app/fuzzy_extractor.pdf explains how fuzzy extractors derive stable cryptographic keys from noisy biometric data. The academic foundation: "Fuzzy Extractors: How to Generate Strong Keys from Biometrics" by Dodis, Reyzin, Smith (EUROCRYPT 2004) at cs.bu.edu/~reyzin/fuzzy.html.

**ZK circuits deep dive:**

Circom documentation at docs.circom.io covers the DSL used by Semaphore, Polygon ID, and most production ZK systems. SnarkJS at github.com/iden3/snarkjs handles proof generation. For Groth16 trusted setup context, see the Perpetual Powers of Tau ceremony documentation.

### If you're a community organizer considering Villa Identity

**Pop-up city identity lessons:**

Vitalik's "Why I Built Zuzalu" (Palladium Magazine, October 2023) explains why 200-person communities hit the sweet spot and why governance and membership remain unsolved. His "Let a Thousand Societies Bloom" post outlines the decentralized Zu-village future.

**Zupass in practice:**

Zuzalu used Zupass for 2 months with 800+ daily users generating hundreds of thousands of ZK proofs. Zupoll enabled anonymous governance voting. Zucast provided pseudonymous discussion. Both worked because residents could prove membership without revealing identity.

**Edge City's approach:**

Edge City Lanna (Chiang Mai, October-November 2024) served 700+ residents with ZK-powered check-ins. Cursive Connections used NFC wristbands with MPC for privacy-preserving social networking—people discovered shared interests without revealing their data. Read Edge City's "What We Learned in 2024" retrospective.

**The identity fragmentation problem:**

AKASHA Foundation documented how Zuzalu communication "remained fragmented across a noisy Telegram group and various Discord chat groups." Residents had separate identities on Zupass, Telegram, Discord, email—no unified social graph. This is what Villa solves.

**Privacy as competitive advantage:**

Rarimo's Freedom Tool demonstrates privacy-preserving voting for e-democracy. Polygon ID's zkKYC shows selective disclosure in action. These aren't nice-to-haves—they're why communities choose ZK solutions over traditional identity.

### If you're exploring the space

**Network state context:**

Balaji Srinivasan's "The Network State" (2022) provides the theoretical foundation. His Network School (Singapore, September-December 2024) with 150 students represents the educational layer. Praxis raised **$525 million** in October 2024 to build permanent network state infrastructure.

**ZK identity landscape overview:**

Rarimo at docs.rarimo.com offers passport-based identity with client-side proving. Polygon ID at docs.privado.id implements W3C verifiable credentials with ZK selective disclosure. Worldcoin (33 million users) takes the biometric approach with iris scanning. Each makes different tradeoffs between privacy, usability, and decentralization.

**0xPARC resources:**

"ZK Identity: Why and How" (0xparc.org/blog/zk-id-1) introduces the design space. "Why Now for PCD?" (pcd.team/why-now) explains timing. Devcon SEA talks "Behind Zupass: Applied Cryptography for Consumers" and "Introducing Provable Object Data" show production challenges.

**Pop-up city growth data:**

Nine thousand attendees across Edge City events in 2024 alone. Twenty-plus Zuzalu-inspired events on every continent within 18 months. 10,000+ Zupass users. This isn't experimental—it's a movement with infrastructure needs.

---

## Part Two: Product specification

### Problem statement

Pop-up city residents face **identity fragmentation**: separate credentials for each community, no portable reputation, and a forced choice between privacy and verification. Zuzalu proved ZK identity works; now we need it to work across the entire ecosystem.

Current pain points:

- **No cross-event portability**: "Zuzalu karma" can't transfer to Edge City
- **Privacy-verification tension**: Communities need to verify membership; residents want pseudonymity
- **Membership ambiguity**: Who counts as "resident" vs "visitor" vs "organizer"?
- **Communication silos**: Identity fragmented across Telegram, Discord, Zupass, email
- **Recovery nightmare**: Lose your device, lose your identity

### User stories and acceptance criteria

**Story 1: Cross-community check-in**
_As an Edge City Lanna alumnus arriving at Vitalia, I want to prove my pop-up city experience without revealing which events I attended or any personal information._

Acceptance criteria:

- User presents single QR code to Vitalia staff
- Staff sees: "Verified: attended 2+ month-long pop-up cities in 2024"
- Staff does NOT see: specific events, dates, user name, or any linkable identifier
- Verification completes in under 3 seconds
- Works offline (proof generated client-side)

**Story 2: Passkey-first onboarding**
_As a new resident at Edge City Denver, I want to create my Villa Identity using just Face ID—no seed phrases, browser extensions, or crypto knowledge required._

Acceptance criteria:

- Onboarding completes in under 60 seconds
- User authenticates via device biometric (Face ID, Touch ID, fingerprint)
- Smart account created via EIP-7702 delegation
- User receives verifiable credential bound to their passkey
- Recovery path established (Unforgettable biometric backup)
- Zero seed phrase exposure at any point

**Story 3: Tiered access control**
_As an event organizer, I want to gate the residents-only lounge based on length of stay—without maintaining a separate access list._

Acceptance criteria:

- Organizer defines policy: "minimum 14 days attendance"
- Users with qualifying credentials can generate proof
- QR scan grants access; non-qualifying users see clear rejection message
- No attendance data transmitted—only binary pass/fail
- Policy updates propagate within 5 minutes

**Story 4: Biometric recovery**
_As a user who lost their phone, I want to recover my Villa Identity using my face and a memorable object—without any seed phrase._

Acceptance criteria:

- User initiates recovery on new device
- Scans face (14-20 bits entropy)
- Photos memorable object they chose during setup (40 bits entropy)
- Enters password (49 bits entropy)
- Achieves 112-bit security threshold
- Full identity restored including credentials and delegation history
- Old device's passkey automatically revoked

### Architecture decisions

**Decision 1: Porto SDK as account layer**

_Rationale:_ Porto implements EIP-7702 natively with passkey support. The team (Ithaca/Paradigm) built Reth, Foundry, and Wagmi—the most trusted tools in Ethereum development. Porto achieves 71% faster execution than ERC-4337 alternatives and handles RIP-7212 P256 verification seamlessly.

_Alternative considered:_ Safe Protocol with custom passkey module. Rejected due to higher integration complexity and lack of native EIP-7702 support.

**Decision 2: Zupass-compatible PCD format**

_Rationale:_ 10,000+ existing Zupass users. Proven at Devcon SEA (10,000+ devices). Established ecosystem of verification tools. Compatibility means instant network effects.

_Alternative considered:_ Polygon ID verifiable credentials. Rejected due to issuer-centric model—pop-up cities need permissionless self-issuance.

**Decision 3: Unforgettable for backup recovery**

_Rationale:_ Fuzzy extractors solve the "noisy biometric" problem cryptographically. Multi-factor combination (face + object + password) achieves 112-bit security. No seed phrases means dramatically lower custody risk.

_Alternative considered:_ Social recovery via guardian network. Rejected due to coordination overhead for nomadic users who may not maintain stable relationships.

**Decision 4: TinyCloud for credential storage**

_Rationale:_ DID-based access control, delegatable capabilities (UCAN), and SpruceID heritage (SIWE originators). Users own their data; apps request access through capability delegation.

_Alternative considered:_ Ceramic Network. Rejected due to complexity of anchor system and higher operational overhead.

**Decision 5: Semaphore V4 for group membership proofs**

_Rationale:_ Production-proven across Worldcoin (33M users), Zupass, and 50+ projects. Well-audited circuits. Established nullifier system prevents double-claiming.

_Alternative considered:_ Custom circuits for specific claims. Deferred to Phase 3—Semaphore handles 80% of use cases.

### Integration architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER DEVICE                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │  WebAuthn   │  │ Unforgettable│  │    Villa Identity App      │  │
│  │  (Passkey)  │  │  (Recovery)  │  │  - PCD wallet (Zupass-compat)│
│  │             │  │              │  │  - Proof generation         │
│  │ Secure      │  │ Face +       │  │  - Credential management    │
│  │ Enclave     │  │ Object +     │  │  - QR presentation          │
│  │             │  │ Password     │  │                             │
│  └──────┬──────┘  └──────┬───────┘  └─────────────┬───────────────┘ │
│         │                │                        │                 │
│         └────────────────┴────────────────────────┘                 │
│                          │                                          │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SMART ACCOUNT (EIP-7702)                       │
├─────────────────────────────────────────────────────────────────────┤
│  Delegated to Villa Account Contract                                │
│  - Primary signer: Passkey (P256 via RIP-7212)                      │
│  - Backup signer: Unforgettable-derived key                         │
│  - Policy engine: Spending limits, timelocks, session keys          │
│  - Gas abstraction: Paymaster integration                           │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│   TinyCloud     │ │  Semaphore  │ │    Rarimo       │
│   (Storage)     │ │  (Groups)   │ │  (Passport ZK)  │
│                 │ │             │ │                 │
│ - Credentials   │ │ - Membership│ │ - Age proof     │
│ - Preferences   │ │ - Nullifiers│ │ - Nationality   │
│ - Social graph  │ │ - Signals   │ │ - Uniqueness    │
└─────────────────┘ └─────────────┘ └─────────────────┘
```

### Implementation phases

**Phase 1: Passkey-native account creation (4 weeks)**

Deliverables:

- Porto SDK integration for EIP-7702 smart accounts
- WebAuthn passkey registration and authentication flow
- Basic credential issuance (attendance stamps)
- QR code proof presentation

Implementation confidence for Claude Code delegation: **85%**
Human review gates: Smart contract deployment, signature verification logic

**Phase 2: Cross-community credentials (6 weeks)**

Deliverables:

- Zupass PCD format compatibility
- Semaphore V4 group membership proofs
- Privacy-preserving attendance verification
- Credential aggregation (prove "2+ events" without revealing which)

Implementation confidence for Claude Code delegation: **70%**
Human review gates: ZK circuit correctness, nullifier collision prevention, credential schema design

**Phase 3: Biometric recovery (4 weeks)**

Deliverables:

- Unforgettable SDK integration
- Face + object + password enrollment flow
- Recovery ceremony UX
- Automatic old-device revocation

Implementation confidence for Claude Code delegation: **65%**
Human review gates: Fuzzy extractor parameter selection, entropy calculations, recovery security model

**Phase 4: Ecosystem expansion (ongoing)**

Deliverables:

- Rarimo passport integration for nationality/age proofs
- TinyCloud credential storage with delegation
- Developer SDK and documentation
- Reference implementations for common patterns

Implementation confidence for Claude Code delegation: **75%**
Human review gates: Third-party API security, delegation scope limits

### Security-adjacent change policy

The following changes require human cryptographer review before deployment:

- Any modification to signature verification logic
- ZK circuit changes (even "minor" optimizations)
- Nullifier generation or storage
- Fuzzy extractor parameters
- Delegation scope definitions
- Recovery flow logic
- Smart contract upgrades

Claude Code agents should flag these changes and halt for review rather than proceeding autonomously.

---

## Part Three: Why Villa Identity matters

### For digital nomads and temporary community residents

**You arrive at Edge City Lanna.** The organizer scans your phone. In two seconds, they know you've attended pop-up cities before—but not which ones, not when, not your name. You get the returning-resident welcome without the privacy invasion.

**Your phone dies in a taxi in Chiang Mai.** You buy a new one at 7-Eleven. You take a selfie, photograph the stuffed elephant you chose during setup, enter your password. Your identity reconstitutes. Every credential intact. No seed phrase panic. No begging community admins for re-verification.

**You're building a reputation across communities.** Contributed to governance at Zuzalu. Organized workshops at Edge City Denver. Co-created curriculum at Vitalia. Villa aggregates these without doxxing you—you can prove "active contributor to 3+ pop-up cities" without revealing which ones or linking your personas.

This is identity for people who belong everywhere and nowhere. Who want accountability without surveillance. Who've learned that the best communities emerge when people can be known for their contributions, not their credentials.

### Pain points Villa solves

**"I have 47 Telegram chats and can't prove any of it"**

Every pop-up city generates its own silo. Zuzalu Telegram. Edge City Discord. Vitalia Signal. Your reputation exists—in fragments, inaccessible, non-portable. Villa creates a single credential layer that aggregates participation without centralizing data.

**"The organizers know too much"**

Current check-in systems collect names, emails, passport scans. Even well-intentioned organizers accumulate sensitive data. Villa's ZK architecture means verification without data collection—organizers learn only what they need ("is this person allowed here?") and nothing more.

**"I lost my seed phrase"**

Twelve words written on paper, hidden somewhere, probably lost. The crypto onboarding ritual that's cost the ecosystem billions. Villa uses passkeys stored in your device's secure enclave, backed by biometric recovery. Nothing to write down. Nothing to lose.

**"Every community wants me to start from zero"**

Three events with the same organizers and you're still re-verifying from scratch. Villa credentials are portable by design—prove your history once, carry it everywhere.

### For developers: why build on Villa Identity

**Zupass compatibility means instant users.** Ten thousand people already have Zupass credentials. Villa's PCD format compatibility means they can use your app on day one.

**EIP-7702 + RIP-7212 = production-ready passkeys.** Porto SDK abstracts the complexity. You get native biometric auth without building wallet infrastructure from scratch.

**The pop-up city market is growing fast.** Nine thousand Edge City attendees in 2024. Twenty-plus Zuzalu-inspired events globally. Praxis raised $525M. This isn't a niche—it's an emerging vertical with real infrastructure needs.

**Privacy as default, not afterthought.** Semaphore proofs, fuzzy extractors, selective disclosure—the cryptographic primitives are integrated. You don't bolt on privacy; you inherit it.

**Open source, forkable, extensible.** Villa Identity is infrastructure, not a platform. Build your community's identity layer without vendor lock-in.

```typescript
// Check if user attended any month-long pop-up city
const proof = await villa.generateProof({
  claim: "attended_popup_city",
  requirements: { minDuration: 30, minCount: 1 },
  disclose: [], // reveal nothing beyond the claim
});

// Verify without learning which events
const valid = await villa.verify(proof);
// Returns: true | false
// Organizer learns: "this person qualifies"
// Organizer does NOT learn: which events, when, user identity
```

### For community organizers: why adopt Villa Identity

**Lower liability, same verification.** Collecting passport scans creates GDPR headaches and security obligations. Villa verifies residency eligibility without collecting sensitive data—your compliance burden drops dramatically.

**Reputation bootstrapping.** New communities can leverage the existing Villa credential graph. If someone has Edge City credentials, they're probably not a random stranger. Graduated trust without manual vetting.

**Governance-ready.** Anonymous voting with proof of residency. Contribution tracking without surveillance. The infrastructure Vitalik said Zuzalu still needed—"we have to solve governance and membership more."

**Works with what you have.** Zupass compatibility means existing Zuzalu ecosystem tools—Zupoll, Zucast, Zuauth—work with Villa credentials. You don't replace your stack; you enhance it.

### Concrete scenarios

**Edge City check-in, 2026:**
Resident approaches desk. Opens Villa app, shows QR code. Organizer's tablet shows green checkmark and "Verified: returning pop-up city resident." No name displayed. No passport scanned. Resident gets wristband, heads to orientation.

**Vitalia clinical trial screening:**
Researcher needs participants over 21 who haven't enrolled in conflicting studies. Candidate generates Villa proof: "age ≥ 21" (via Rarimo passport integration) + "not enrolled in study X, Y, Z" (via credential history). Researcher sees: qualified. Researcher doesn't see: actual age, name, passport number, medical history.

**Cross-community governance:**
Pan-ecosystem vote on shared infrastructure funding. Only residents who attended 2+ different pop-up cities in the past year qualify. Each voter generates proof demonstrating qualification without revealing which communities or total count. One person, one vote—verified cryptographically, not administratively.

**Emergency recovery:**
User's phone stolen in transit between Edge City and Vitalia. New device purchased. Unforgettable recovery initiated: face scan, photo of memorable object, password entry. Within 5 minutes, full identity restored. Thief's device credentials automatically revoked. No community admin intervention required.

### Connection to the ecosystem

Villa Identity builds on foundations laid by Zuzalu, 0xPARC, and the broader Ethereum identity community:

**Zupass compatibility** ensures existing credentials remain valid. The 10,000+ users who've generated hundreds of thousands of ZK proofs can use Villa from day one.

**Semaphore protocol** (PSE/Ethereum Foundation) provides battle-tested anonymous signaling. Worldcoin, with 33 million users, validates the cryptographic approach at scale.

**Porto SDK** (Ithaca/Paradigm) delivers production-grade EIP-7702 infrastructure. The team's track record—Reth, Foundry, Wagmi, Viem—represents the highest engineering standards in Ethereum tooling.

**Rarimo integration** enables passport-based proofs without Worldcoin's hardware requirements. Client-side proving means no centralized verification infrastructure.

**Edge City + Vitalia + Zuzalu ecosystem** represents the immediate user base and feedback loop. We're building for communities that already exist, solving problems they've already articulated.

---

## Voice and principles

**Technical but accessible.** We assume readers are smart but don't assume they've read every EIP. Explain the "why" alongside the "what."

**Specs-driven development.** Ambiguity kills velocity. Every feature has acceptance criteria. Every architecture decision has rationale.

**Privacy as non-negotiable.** Not a feature to add later. Not a toggle for power users. The default state is "reveal nothing beyond the claim."

**Minimal lovable product.** Ship the smallest thing that solves a real problem well. Iterate based on actual community usage, not imagined requirements.

**Open source by default.** Infrastructure belongs to the ecosystem. Forkable, auditable, improvable by anyone.

**Concrete over abstract.** "Privacy-preserving identity" means nothing. "Prove you attended 2+ pop-up cities without revealing which ones" is a real capability.

---

_Villa Identity is infrastructure for communities that don't exist yet—built on lessons from communities that do. We're not building an identity platform; we're building the identity layer that lets a thousand pop-up cities bloom._

_Questions, collaboration proposals, and pull requests welcome._
