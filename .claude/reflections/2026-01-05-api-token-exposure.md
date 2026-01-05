# Reflection: API Token Exposure Incident (2026-01-05)

## Incident Summary

**What happened:** Real Cloudflare API token was committed to public repository in `docs/guides/ens-setup.md`

**Token:** `kpFQ_8IfnLdMZF1xw99M7CkPyEwjEoMDx6bEUWLE` (MUST BE ROTATED)

**Exposure window:** Commit `0ae16ba` to squash-merge (several hours in public git history)

---

## Token Efficiency Score

| Category | Actual | Target | Score |
|----------|--------|--------|-------|
| Security awareness | 0/1 | 100% | :x: |
| Pre-commit review | 0/1 | 100% | :x: |
| Agent delegation | 4/5 tasks | 80%+ | :white_check_mark: |
| CI detection | Caught | Caught | :white_check_mark: |

---

## Root Cause Analysis

### Primary Failure: Copy-Paste from Shell History

I copied real commands from terminal session into documentation:

```bash
# What I ran in terminal (with real token):
CLOUDFLARE_API_TOKEN="kpFQ_8If..." npx tsx ...

# What I should have written in docs:
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" npx tsx ...
```

### Contributing Factors

1. **Speed over safety:** Rushing to document while commands were fresh
2. **No pre-commit secret scan:** `pnpm verify` doesn't include secret detection
3. **Trust in CI:** Assumed security scan would catch before merge (it did, but too late)
4. **Lack of separation:** Writing docs in same terminal where secrets were used

---

## What Burned Tokens

| Issue | Root Cause | Time Lost |
|-------|------------|-----------|
| Security scan failure | Token in docs | ~15 min debugging |
| Fix + re-push | Removing token | ~5 min |
| Reflection writing | This document | ~10 min |
| **Token rotation (human)** | **Manual Cloudflare action** | **~5 min** |

**Total incident cost:** ~35 min + reputational risk

---

## What Saved Tokens

1. **TruffleHog in CI** - Caught the exposure before main branch merge
2. **Squash merge** - Clean history on main (branch history still exposed)
3. **Quick identification** - `grep` found exact location immediately

---

## Immediate Actions

### HUMAN REQUIRED (Cannot be automated by Claude)

- [ ] **Rotate Cloudflare API token** in Cloudflare dashboard
- [ ] Update GitHub secret `CLOUDFLARE_API_TOKEN` with new token
- [ ] Verify new token works: `pnpm run infra:status`

### Claude Actions (Done)

- [x] Removed token from code (commit `08c71b9`)
- [x] Squash-merged PR to clean main history
- [x] Added learning to LEARNINGS.md

---

## Prevention: New Patterns

### 1. Documentation Command Template

```bash
# ❌ NEVER: Copy from shell history
CLOUDFLARE_API_TOKEN="actual_token_value" cmd

# ✅ ALWAYS: Use env var references
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" cmd
```

### 2. Pre-Commit Secret Scan

Add to `pnpm verify`:

```bash
# Check for high-entropy strings in staged files
git diff --cached --name-only | xargs grep -l -E '[a-zA-Z0-9_-]{30,}' || true
```

### 3. Separation of Concerns

```
Terminal 1: Operations (with real secrets)
Terminal 2: Documentation (no secrets loaded)

NEVER copy commands between terminals
```

### 4. Token Pattern Recognition

Before committing docs with commands, scan for:
- 32+ character alphanumeric strings
- Strings matching `[a-zA-Z0-9_-]{20,}`
- Any value after `TOKEN=`, `KEY=`, `SECRET=`

---

## LEARNINGS.md Update

```markdown
### 21. Secret Handling in Documentation (CRITICAL)

**Incident:** Real API token committed to public docs (2026-01-05)

:x: NEVER: Copy commands from shell history to docs
```bash
CLOUDFLARE_API_TOKEN="kpFQ..." npx cmd  # Real token leaked!
```

:white_check_mark: ALWAYS: Use env var references in docs
```bash
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" npx cmd
```

**Pre-commit check for secrets:**
```bash
# Add to verify script or pre-commit hook
git diff --cached | grep -E '(TOKEN|KEY|SECRET|PASSWORD).*=.*[a-zA-Z0-9_-]{20,}' && \
  echo "WARNING: Possible secret in staged changes" && exit 1
```

**Even if CI catches it:** The token is already in git history. Git never forgets.
```

---

## Human-AI Partnership Learning

**As a human partner on a public repo, I must:**

1. **Never assume CI is the first line of defense** - Commits are public immediately
2. **Treat every keystroke as permanent** - Git history persists even after "fixes"
3. **Separate execution from documentation** - Don't copy real commands into docs
4. **When in doubt, use placeholders** - `YOUR_TOKEN_HERE` is always safer

**The repo is the single source of truth.** What goes in stays in (somewhere).

---

## Accountability

This incident was caused by:
- Moving too fast
- Not respecting that this is a PUBLIC repository
- Treating documentation as less critical than code

**Apology:** I should have been more careful. The token exposure creates work for the human partner (rotation) and potential security risk if exploited before rotation.

---

*Filed: 2026-01-05T07:20:00Z*
*Status: Token rotation REQUIRED*
