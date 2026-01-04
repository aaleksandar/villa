# Specifications

**Look in `active/` first** - that's what's being built now.

```
specs/
├── active/       Currently developing - START HERE
├── done/         Implemented - reference only
├── reference/    Evergreen guides (vision, design)
└── templates/    For creating new specs
```

---

## Specs by Package

### @villa/sdk (packages/sdk/)

| Spec | Status | Description |
|------|--------|-------------|
| [identity-sdk.md](active/identity-sdk.md) | Active | SDK architecture and API |
| [sdk-mlp-roadmap.md](active/sdk-mlp-roadmap.md) | Active | MLP sprint tracking |
| [auth-flow.md](active/auth-flow.md) | Active | Authentication UX flows |

**Key SDK Files:**
- `packages/sdk/src/client.ts` - Villa class (main entry)
- `packages/sdk/src/iframe.ts` - Auth iframe + postMessage
- `packages/sdk/README.md` - SDK documentation

### @villa/web (apps/web/)

| Spec | Status | Description |
|------|--------|-------------|
| [returning-user-flow.md](active/returning-user-flow.md) | Active | Returning user experience |
| [nickname.md](active/nickname.md) | Active | Nickname claiming |
| [avatar-system.md](done/avatar-system.md) | Done | Avatar generation |
| [avatar-selection.md](done/avatar-selection.md) | Done | Avatar picker UX |
| [v1-passkey-login.md](done/v1-passkey-login.md) | Done | Passkey auth |

**Key Web Files:**
- `apps/web/src/app/developers/` - Developer portal
- `apps/web/src/components/sdk/` - SDK auth screens

### @villa/contracts (contracts/)

| Spec | Status | Description |
|------|--------|-------------|
| [contracts-production-readiness.md](contracts-production-readiness.md) | Review | Production checklist |
| [villa-biometric-recovery-spec.md](active/villa-biometric-recovery-spec.md) | Active | Biometric recovery |

**Deployed Contracts (Base Sepolia):**
- VillaNicknameResolverV2: `0xf4648423aC6b3f6328018c49B2102f4E9bA6D800`
- BiometricRecoverySignerV2: `0xdFb55a363bdF549EE5C2e77D0aAaC39276ED5836`

### Infrastructure

| Spec | Status | Description |
|------|--------|-------------|
| [v2-architecture.md](active/v2-architecture.md) | Active | Monorepo structure |
| [infrastructure-postgres.md](infrastructure-postgres.md) | Done | PostgreSQL setup |
| [database-security.md](database-security.md) | Done | Security model |

---

## Current Sprint: Sprint 2

**Focus:** Iframe Integration & Developer Portal

1. SDK iframe container with postMessage bridge
2. Developer portal for app registration
3. Wire SDK screens to Porto auth

Progress: [sdk-mlp-roadmap.md](active/sdk-mlp-roadmap.md)

---

## Done Specs

| Spec | Description | Shipped |
|------|-------------|---------|
| [v1-passkey-login.md](done/v1-passkey-login.md) | Passkey authentication | 2026-01 |
| [avatar-system.md](done/avatar-system.md) | DiceBear avatars | 2026-01 |
| [avatar-selection.md](done/avatar-selection.md) | Avatar picker | 2026-01 |
| [identity-system.product.md](done/identity-system.product.md) | Identity product spec | 2026-01 |

---

## Reference

| Doc | Purpose |
|-----|---------|
| [vision.md](reference/vision.md) | Product vision |
| [design-system.md](reference/design-system.md) | UI patterns |
| [design-principles.md](reference/design-principles.md) | UX principles |
| [tech-spec-guide.md](reference/tech-spec-guide.md) | How to write specs |

---

## Creating New Specs

1. Draft in Claude GUI (iterate conversationally)
2. Copy to `specs/active/` with metadata
3. Implement with `@build` agent
4. Move to `specs/done/` when shipped

See [spec-sync.md](reference/spec-sync.md) for workflow.
