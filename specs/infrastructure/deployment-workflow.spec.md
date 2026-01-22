# Deployment Workflow Spec

**Version:** 1.0
**Created:** 2026-01-22
**Status:** Proposed

---

## Executive Summary

Simplified DigitalOcean deployment infrastructure with clear multi-person workflow. Reduces from 7 environments to 3 essential environments while maintaining quality gates and PR previews.

---

## Environment Architecture

### Simplified Environment Map

| Environment    | Domain                  | Purpose                          | Deploy Trigger  | DO App             | Instance Size |
| -------------- | ----------------------- | -------------------------------- | --------------- | ------------------ | ------------- |
| **Production** | `villa.cash`            | Stable releases                  | Manual tag `v*` | `villa-production` | basic-xs      |
| **Staging**    | `beta.villa.cash`       | Pre-release testing, PR previews | Push to `main`  | `villa-staging`    | basic-xxs     |
| **Developers** | `developers.villa.cash` | Documentation portal             | Push to `main`  | `villa-developers` | basic-xxs     |

### Removed Environments (Cost Savings)

| Old Environment       | Reason for Removal                  | Action        |
| --------------------- | ----------------------------------- | ------------- |
| `dev-1.villa.cash`    | PR previews merged into staging     | Delete DO app |
| `dev-2.villa.cash`    | PR previews merged into staging     | Delete DO app |
| `dev-3.villa.cash`    | Ngrok tunnel rarely used            | Remove DNS    |
| `key.villa.cash`      | Now alias of `villa.cash/auth`      | Keep as alias |
| `beta-key.villa.cash` | Now alias of `beta.villa.cash/auth` | Keep as alias |

### DNS Configuration (CloudFlare)

```
# Production
villa.cash          CNAME   villa-production-xxx.ondigitalocean.app
www.villa.cash      CNAME   villa.cash
key.villa.cash      CNAME   villa.cash   # Alias for /auth route

# Staging
beta.villa.cash     CNAME   villa-staging-xxx.ondigitalocean.app
beta-key.villa.cash CNAME   beta.villa.cash

# Developers
developers.villa.cash CNAME villa-developers-xxx.ondigitalocean.app
```

---

## Multi-Person Workflow

### Pipeline Diagram (ASCII)

```
                            DEVELOPMENT WORKFLOW
================================================================================

   LOCAL DEV              GITHUB                 STAGING              PRODUCTION
   ---------              ------                 -------              ----------

  [Your Machine]
       |
       | 1. Create feature branch
       |    feat/my-feature
       v
  +-----------+
  | bun dev   |  <-- Local testing
  | bun test  |
  | bun verify|
  +-----------+
       |
       | 2. Push branch + open PR
       v
              +-----------------+
              |  Pull Request   |
              |  CI: lint, type |
              |  CI: E2E tests  |
              +-----------------+
                     |
                     | 3. PR Review
                     |    - Code review
                     |    - Test results
                     v
              +-----------------+
              |  Merge to main  |
              +-----------------+
                     |
                     | 4. Auto-deploy
                     v
                            +---------------------+
                            | beta.villa.cash     |
                            | Staging Environment |
                            +---------------------+
                                    |
                                    | 5. QA Testing
                                    |    - Manual verification
                                    |    - Smoke tests
                                    v
              +-----------------+
              | Create v* tag   |  <-- Manual decision
              | e.g., v0.15.0   |
              +-----------------+
                     |
                     | 6. Production deploy
                     v
                                              +---------------------+
                                              | villa.cash          |
                                              | Production          |
                                              +---------------------+

================================================================================
```

### Branch Naming Conventions

| Pattern        | Purpose           | Example                     |
| -------------- | ----------------- | --------------------------- |
| `feat/xxx`     | New feature       | `feat/cross-chain-deposits` |
| `fix/xxx`      | Bug fix           | `fix/passkey-timeout`       |
| `chore/xxx`    | Maintenance       | `chore/update-deps`         |
| `docs/xxx`     | Documentation     | `docs/api-reference`        |
| `refactor/xxx` | Code refactoring  | `refactor/auth-flow`        |
| `test/xxx`     | Test improvements | `test/e2e-stability`        |

### Avoiding Conflicts (Multi-Person)

#### Rule 1: Feature Branch Isolation

```bash
# Always work on feature branches, never directly on main
git checkout -b feat/my-feature

# Keep branch up to date with main
git fetch origin
git rebase origin/main
```

#### Rule 2: Small, Focused PRs

| Good PR               | Bad PR                     |
| --------------------- | -------------------------- |
| Single feature or fix | Multiple unrelated changes |
| < 500 lines changed   | > 1000 lines changed       |
| Clear scope           | "Various improvements"     |

#### Rule 3: Communication

- Ping team in Telegram before starting large features
- Assign yourself to GitHub issues
- Use `[WIP]` prefix for draft PRs

---

## PR Checklist Template

Copy this into PR descriptions:

```markdown
## Checklist

### Before Review

- [ ] Local `bun verify` passes (typecheck + lint + build)
- [ ] Added/updated tests for changes
- [ ] No console.log or debug code
- [ ] Commit messages follow conventional format

### For Reviewer

- [ ] Code follows project patterns
- [ ] No security concerns (secrets, env vars)
- [ ] UI changes tested on mobile viewport
- [ ] Changes are backward compatible

### Before Merge

- [ ] All CI checks pass
- [ ] At least 1 approval
- [ ] No unresolved comments
- [ ] Squash commits if messy history
```

---

## Verification Gates

### Pre-Merge Requirements

| Gate        | Tool                 | Blocks Merge     |
| ----------- | -------------------- | ---------------- |
| Type check  | `bun typecheck`      | Yes              |
| Lint        | `bun lint`           | Yes              |
| E2E Tests   | Playwright (sharded) | Yes              |
| Build       | Docker build         | Yes              |
| Code Review | GitHub               | Yes (1 approval) |

### Pre-Production (Tag) Requirements

| Gate             | Description                              | Action                  |
| ---------------- | ---------------------------------------- | ----------------------- |
| Staging Healthy  | `beta.villa.cash/api/health` returns 200 | Auto-check              |
| QA Sign-off      | Manual verification on staging           | Tag creator responsible |
| No Critical Bugs | Check GitHub issues                      | Tag creator responsible |
| Changelog        | Document changes in release notes        | Auto-generated          |

---

## Deployment Commands

### Local Development

```bash
# Standard development
bun dev              # Start all apps
bun verify           # Run before every push

# With HTTPS (required for passkeys)
bun docker:https     # Start Docker stack
open https://local.villa.cash
```

### Manual Deployments (Ops)

```bash
# Check staging health
curl -s https://beta.villa.cash/api/health | jq .

# Create production release
git tag v0.15.0
git push origin v0.15.0

# Check production health
curl -s https://villa.cash/api/health | jq .
```

### Rollback (Emergency)

```bash
# Identify last good tag
git tag -l 'v*' --sort=-v:refname | head -5

# Redeploy previous version
git checkout v0.14.3
git tag v0.14.4-hotfix  # New tag triggers deploy
git push origin v0.14.4-hotfix
```

---

## Cost Optimization

### Current DO Spend (Estimated)

| App              | Size      | Monthly Cost  |
| ---------------- | --------- | ------------- |
| villa-production | basic-xs  | $12           |
| villa-staging    | basic-xxs | $5            |
| villa-dev-1      | basic-xxs | $5            |
| villa-dev-2      | basic-xxs | $5            |
| villa-developers | basic-xxs | $5            |
| **Total**        |           | **$32/month** |

### Proposed DO Spend

| App              | Size      | Monthly Cost  |
| ---------------- | --------- | ------------- |
| villa-production | basic-xs  | $12           |
| villa-staging    | basic-xxs | $5            |
| villa-developers | basic-xxs | $5            |
| **Total**        |           | **$22/month** |

### Savings: $10/month (~31% reduction)

### Scaling Guidelines

| Situation                  | Action             | Cost Impact |
| -------------------------- | ------------------ | ----------- |
| Traffic spike (production) | Scale to basic-s   | +$10/month  |
| Major release testing      | Keep current       | $0          |
| Low traffic period         | Stay at basic-xxs  | $0          |
| Database growth            | Upgrade managed DB | Variable    |

---

## Telemetry Dashboard Pipeline Display

The Telemetry app should display this pipeline order:

```typescript
// apps/telemetry/src/lib/types.ts

export const PIPELINE_STAGES = [
  {
    id: "local",
    name: "Local Dev",
    description: "bun dev + bun verify",
    url: "https://local.villa.cash",
    status: "manual",
  },
  {
    id: "pr",
    name: "Pull Request",
    description: "CI: lint, type, E2E tests",
    url: null,
    status: "auto",
  },
  {
    id: "staging",
    name: "Staging",
    description: "Auto-deploy on merge to main",
    url: "https://beta.villa.cash",
    status: "auto",
  },
  {
    id: "production",
    name: "Production",
    description: "Deploy on v* tag",
    url: "https://villa.cash",
    status: "manual",
  },
] as const;

export const ENVIRONMENT_HEALTH_ENDPOINTS = {
  staging: "https://beta.villa.cash/api/health",
  production: "https://villa.cash/api/health",
  developers: "https://developers.villa.cash",
} as const;
```

### Pipeline Visualization (Telemetry UI)

```
Pipeline Status
================

Local     PR        Staging      Production
  |        |           |             |
  o--------o-----------o-------------o
  |        |           |             |
 [DEV]   [CI]    [AUTO-DEPLOY]   [MANUAL TAG]
          |           |             |
          v           v             v
        Tests     beta.villa.cash  villa.cash
```

---

## GitHub Actions Workflow Summary

### deploy.yml Triggers

| Event            | Condition             | Action                  |
| ---------------- | --------------------- | ----------------------- |
| `push` to `main` | Always                | Deploy to staging       |
| `push` tag `v*`  | Always                | Deploy to production    |
| `pull_request`   | Not draft, not closed | Run CI, comment results |

### Job Dependencies

```
detect-changes
      |
      v
quick-ci (PRs only)
      |
      +---> e2e-tests (if code changed)
      |           |
      |           v
      |     merge-e2e-reports
      v
check-permission
      |
      v
[PR: comment results]

ci (push to main/tags)
      |
      +---> deploy-staging (main branch)
      |
      +---> deploy-production (v* tags)
```

---

## Migration Plan

### Phase 1: Immediate (Week 1)

- [ ] Delete `villa-dev-1` DO app
- [ ] Delete `villa-dev-2` DO app
- [ ] Remove dev-1/dev-2 CNAME records from CloudFlare
- [ ] Update deploy.yml to remove preview deploy jobs

### Phase 2: Cleanup (Week 2)

- [ ] Delete `.do/app-dev-1.yaml`
- [ ] Delete `.do/app-preview.yaml`
- [ ] Update domains.json
- [ ] Update CLAUDE.md documentation
- [ ] Update README environment table

### Phase 3: Verification (Week 3)

- [ ] Verify staging auto-deploy works
- [ ] Verify production tag deploy works
- [ ] Verify developers.villa.cash stays live
- [ ] Update Telemetry dashboard with new pipeline

---

## Quick Reference

### URLs

| Environment | URL                           | Health Check                       |
| ----------- | ----------------------------- | ---------------------------------- |
| Production  | https://villa.cash            | https://villa.cash/api/health      |
| Staging     | https://beta.villa.cash       | https://beta.villa.cash/api/health |
| Developers  | https://developers.villa.cash | N/A (static)                       |
| Local       | https://local.villa.cash      | http://localhost:3000/api/health   |

### Key Commands

```bash
# Development
bun dev              # Start local dev
bun verify           # Pre-push validation

# Deployment
git push origin main # Auto-deploy to staging
git tag v0.X.X && git push origin v0.X.X  # Deploy to production

# Monitoring
curl -s https://beta.villa.cash/api/health | jq .
curl -s https://villa.cash/api/health | jq .
```

### Emergency Contacts

- **CI Issues:** Check GitHub Actions
- **DO Platform:** DigitalOcean Status Page
- **DNS Issues:** CloudFlare Dashboard
- **Security:** security@villa.cash

---

## Appendix: Full Deploy.yml Changes

### Remove These Jobs

```yaml
# DELETE: deploy-preview job (lines 218-323)
# DELETE: cleanup-preview job (lines 677-696)
# DELETE: preview-related env vars
```

### Update These Jobs

```yaml
# quick-ci: Remove dev-slot output
# check-permission: Keep for documentation purposes
# deploy-staging: No changes needed
# deploy-production: No changes needed
```

---

## Success Criteria

1. **Simplified:** 3 environments instead of 7
2. **Cost Optimized:** $22/month instead of $32/month
3. **Clear Workflow:** Any team member can understand pipeline
4. **Fast Feedback:** PR CI completes in < 5 minutes
5. **Safe Production:** Manual tag required for production deploy
