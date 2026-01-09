# Villa Development Protocols

Zero-decision developer workflows. Copy-paste commands, no thinking required.

---

## Quick Reference

| Task | Command |
|------|---------|
| Start dev (passkeys) | `pnpm dev:local` |
| Start dev (fast) | `pnpm dev` |
| Before push | `pnpm verify` |
| Deploy staging | Push to `main` |
| Deploy prod | Tag `v*` |

---

## 1. Local Development Protocol

### First Time Setup (once)

```bash
# 1. Clone and install
git clone https://github.com/rockfridrich/villa.git
cd villa
pnpm install

# 2. Add local domain (optional but recommended)
sudo ./scripts/setup-hosts.sh

# 3. Start dev
pnpm dev:local
```

### Daily Development

```bash
# Passkey testing (HTTPS + 1Password support)
pnpm dev:local
# Opens: https://local.villa.cash (or https://localhost)

# Fast mode (no passkeys, instant startup)
pnpm dev
# Opens: http://localhost:3000
```

### Stopping

Press `Ctrl+C` - Docker containers auto-cleanup.

### Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 443 in use | `docker compose -f docker-compose.local.yml down` |
| Port 3000 in use | `pkill -f "next dev"` |
| Stale cache | `rm -rf apps/web/.next && pnpm dev:local` |
| Docker issues | `docker system prune -f` |

---

## 2. Git Protocol

### Branching

```bash
# Feature branch
git checkout -b feat/feature-name

# Bug fix branch
git checkout -b fix/bug-description

# Always from main
git checkout main && git pull && git checkout -b <branch>
```

### Committing

```bash
# Conventional commits ONLY
git commit -m "feat: add passkey support"
git commit -m "fix: resolve auth redirect"
git commit -m "docs: update API reference"
git commit -m "refactor: simplify bridge logic"
git commit -m "test: add e2e auth tests"
git commit -m "chore: update dependencies"
```

### Before Push (REQUIRED)

```bash
pnpm verify  # typecheck + lint + build + e2e tests
# If passes → push
# If fails → fix first, NEVER skip
```

### Pull Requests

```bash
# Push branch
git push -u origin feat/feature-name

# Create PR (gh cli)
gh pr create --title "feat: description" --body "## Summary\n..."
```

---

## 3. Deployment Protocol

### Environments

| Environment | Domain | Trigger |
|-------------|--------|---------|
| Local | local.villa.cash | `pnpm dev:local` |
| Staging | beta.villa.cash | Push to `main` |
| Production | villa.cash | Tag `v*` |

### Deploy to Staging (automatic)

```bash
git push origin main
# DigitalOcean auto-deploys in ~3 min
```

### Deploy to Production

```bash
# 1. Ensure main is stable
git checkout main && git pull

# 2. Create version tag
git tag v1.2.3
git push origin v1.2.3
# DigitalOcean auto-deploys
```

### Verify Deployment

```bash
# Check health
curl -s https://beta.villa.cash/api/health | jq .

# Check version (if implemented)
curl -s https://beta.villa.cash/api/version | jq .
```

### Rollback

```bash
# Via DigitalOcean dashboard:
# App > Activity > Select previous deployment > Rollback
```

---

## 4. Environment Variables Protocol

### Local Development

```bash
# Copy template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Required variables:
```bash
NEXT_PUBLIC_CHAIN_ID=84532        # Base Sepolia
DATABASE_URL=                      # Optional for local
```

### Sync with GitHub Secrets

```bash
# View current
pnpm env:list

# Push to GitHub
pnpm env:push:github

# Validate
pnpm env:validate
```

### Never Commit Secrets

Files in `.gitignore`:
- `.env`
- `.env.local`
- `.env.*.local`
- `credentials.json`
- `*.pem`
- `*.key`

---

## 5. Secrets Protocol

### Where Secrets Live

| Secret Type | Storage |
|-------------|---------|
| Local dev | `.env.local` (gitignored) |
| CI/CD | GitHub Secrets |
| Staging/Prod | DigitalOcean App Env |

### Adding a New Secret

```bash
# 1. Add to local
echo "NEW_SECRET=value" >> .env.local

# 2. Add to .env.example (without value!)
echo "NEW_SECRET=" >> .env.example

# 3. Add to GitHub Secrets (via dashboard or gh cli)
gh secret set NEW_SECRET

# 4. Add to DigitalOcean (via dashboard)
# App Platform > Settings > App-Level Environment Variables
```

### Rotating Secrets

```bash
# 1. Update locally
nano .env.local

# 2. Update GitHub
gh secret set SECRET_NAME

# 3. Update DigitalOcean
# Dashboard > App > Settings > Edit secret

# 4. Trigger redeploy
git commit --allow-empty -m "chore: rotate secrets" && git push
```

---

## 6. Database Protocol

### Local Database

```bash
# Start Postgres
pnpm db:start

# Stop
pnpm db:stop

# Reset (wipe all data)
pnpm db:reset
```

### Migrations

```bash
# Generate migration
pnpm db:migrate

# View data
pnpm db:studio
```

### Production Database

```bash
# SSH tunnel to prod DB
pnpm db:tunnel

# Then use db:studio or psql
```

---

## 7. Testing Protocol

### Before Push

```bash
pnpm verify  # Full check
```

### Quick Checks

```bash
pnpm typecheck       # Types only
pnpm lint            # Lint only
pnpm test:e2e        # E2E only
```

### Debug E2E

```bash
# Run with UI
pnpm --filter @villa/web test:e2e:ui

# Run specific test
pnpm --filter @villa/web test:e2e -- --grep "auth"
```

---

## 8. Beads (Task Tracking) Protocol

### Find Work

```bash
bd ready             # Available tasks
bd show <id>         # Task details
```

### Work on Task

```bash
bd update <id> --status=in_progress  # Claim
# ... do work ...
bd close <id>                         # Complete
```

### Create Task

```bash
bd create --title="Fix auth bug" --type=bug --priority=2
```

### End of Session

```bash
bd sync --flush-only  # Export to JSONL
```

---

## Command Cheatsheet

```bash
# Development
pnpm dev:local         # HTTPS + passkeys
pnpm dev               # HTTP only

# Validation
pnpm verify            # Full check (REQUIRED before push)
pnpm typecheck         # Types only
pnpm lint              # Lint only

# Database
pnpm db:start          # Start Postgres
pnpm db:studio         # View data

# Tasks
bd ready               # Find work
bd close <id>          # Complete task

# Deploy
git push origin main   # → staging
git tag v1.x.x && git push --tags  # → production
```
