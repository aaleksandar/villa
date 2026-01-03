# Villa

Privacy-first passkey authentication. Porto SDK wrapper with Villa theming.

**Repo:** https://github.com/rockfridrich/villa

## What We're Building

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Passkey login (Porto SDK) | IN PROGRESS |
| 2 | Recovery (face + guardians) | Next |
| 3 | Community features | Later |
| 4 | AI assistant | Future |

See [BACKLOG.md](../BACKLOG.md) for full roadmap.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## How to Contribute

1. Check [BACKLOG.md](../BACKLOG.md) for what needs doing
2. Read the spec in `specs/`
3. Design in Figma/Lovable (link in spec)
4. Build → Test → Review → Merge

See [docs/contributing.md](../docs/contributing.md) for details.

## Agents

| Agent | Command | Purpose |
|-------|---------|---------|
| spec | `@spec "..."` | Write specs |
| build | `@build "..."` | Implement code |
| test | `@test "..."` | E2E + security tests |
| review | `@review "..."` | Code review |

## Security First

Every PR must pass security checklist. No exceptions.

See [docs/security.md](../docs/security.md) for security model.

## Code Quality

- **CLEAN:** Small functions, clear names, no magic
- **SOLID:** Single responsibility, inject dependencies
- **DRY:** Extract shared logic, but don't over-abstract
- **Performance:** <100ms response, mobile-first, offline-first

Details in `agents/build.md` and `rules.md`.

## Key Files

```
specs/
├── v1-passkey-login.md   # Current work
├── design-system.md      # Tailwind patterns
├── vision.md             # Product vision
└── STATUS.md             # Phase status

docs/
├── security.md           # Security model
├── privacy.md            # Privacy guarantees
└── contributing.md       # How to help

BACKLOG.md                # Public roadmap
```

## Links

- [Porto SDK](https://porto.sh/sdk) — Passkey infrastructure
- [Unforgettable](https://docs.unforgettable.app/sdk/) — Face recovery (Phase 2)
- [Telegram](https://t.me/proofofretreat) — Community chat
