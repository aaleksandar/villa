# Development Learnings

Patterns discovered during development. Session notes archived in `sessions/`.

---

## Core Patterns

### 1. Parallel Execution (DEFAULT)

```
✅ read files → edit → test + review (parallel)
❌ read → wait → edit → wait → test → wait
```

**When to parallelize:**
- Multiple file reads → single message
- Test + Review → always together after build
- Independent searches → multiple Grep/Glob calls

### 2. Environment-Agnostic Testing

```typescript
// ✅ Correct: relative URLs
await page.goto('/')

// ❌ Wrong: hardcoded URLs
const URL = 'https://prod.example.com'
```

Run against any environment:
```bash
BASE_URL=https://x.com npm run test:e2e:chromium
```

### 3. Return Types Over Logging

```typescript
// ❌ Bad: logs PII, returns void
setIdentity: (identity) => void {
  if (error) console.error('Error:', sensitiveData)
}

// ✅ Good: returns boolean, caller handles
setIdentity: (identity) => boolean {
  if (error) return false
}
```

### 4. Atomic SDK Operations

```typescript
// ❌ Bad: race condition
resetInstance()
await useInstance()

// ✅ Good: atomic with options
await useInstance({ forceRecreate: true })
```

### 5. React Cleanup Pattern

```typescript
const timeoutRef = useRef<NodeJS.Timeout>()

useEffect(() => () => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current)
}, [])
```

### 6. btoa() Unicode Encoding

```typescript
// ❌ Bad: btoa() fails on Unicode (emojis, non-ASCII)
const encoded = btoa(unicodeString) // DOMException

// ✅ Good: UTF-8 encode first
const encoded = btoa(unescape(encodeURIComponent(unicodeString)))

// ✅ Better: Use Buffer in Node.js
const encoded = Buffer.from(unicodeString, 'utf-8').toString('base64')
```

**Why:** `btoa()` only handles Latin1 (0-255). Multi-byte UTF-8 characters (emoji, accented chars) throw exceptions. Always UTF-8 encode before base64.

### 7. Knowledge Base Pattern

```
.claude/knowledge/{domain}.md  → Domain-specific learnings
.claude/LEARNINGS.md           → Cross-cutting patterns
docs/reflections/{date}-{topic}.md → Session reflections
```

**When to use:**
- CloudFlare, DigitalOcean, Porto SDK → `knowledge/{domain}.md`
- React patterns, TypeScript patterns → `LEARNINGS.md`
- Multi-session insights → `docs/reflections/`

### 8. Orchestrator Delegation Pattern

```
❌ Bad: Main agent does everything
- Read 50 files
- Implement all changes
- Run tests
- Write reflection

✅ Good: Orchestrator delegates
Main agent:
  ├── @build "Implement avatar system" (sonnet)
  ├── @test "Run E2E tests" (haiku, parallel)
  ├── @review "Review PR" (sonnet, parallel)
  └── Synthesize results
```

**When main agent should delegate:**
- Implementation → @build (sonnet)
- Tests → @test (haiku)
- Code review → @review (sonnet)
- Git operations → @ops (haiku)

**When main agent works directly:**
- Orchestration decisions
- Synthesizing results from agents
- Quick clarifications with human
- Reading specs/docs to plan

---

## Platform Quirks

### DigitalOcean App Platform

| Issue | Fix |
|-------|-----|
| `doctl --format Name` returns `<nil>` | Use `--format Spec.Name` |
| `doctl --format *.Phase` returns `<nil>` | Use `--output json` + jq |
| Buildpacks prune devDeps before build | Use Dockerfile for Next.js |
| PR comments fail | Add `permissions: pull-requests: write` |

**doctl JSON pattern (reliable):**
```bash
# ❌ Unreliable for nested fields
STATUS=$(doctl apps get $ID --format ActiveDeployment.Phase)

# ✅ Always works (note: doctl apps get returns an array, use .[0])
APP_JSON=$(doctl apps get $ID --output json)
STATUS=$(echo "$APP_JSON" | jq -r '.[0].active_deployment.phase // empty')
```

### CI/CD Workflow

| Pattern | Benefit |
|---------|---------|
| Draft PRs skip E2E | Fast iteration (~30s vs ~3min) |
| `[wip]` in PR title | Skip E2E explicitly |
| GIFs in bot comments | Delightful contributor experience |
| Clickable preview URLs | Easy manual testing |
| E2E sharding (2 shards) | 50% faster E2E tests |
| Playwright browser cache | 90% faster browser setup |
| Next.js build cache | Faster incremental builds |

### Porto SDK

| Issue | Fix |
|-------|-----|
| Iframe mode needs domain registration | Contact @porto_devs on Telegram |
| ngrok always uses popup mode | Expected (not in trusted hosts) |
| Session TTL ~24h | Server-controlled, not configurable |

---

## Anti-Patterns

- ❌ Sequential when parallel possible
- ❌ Hardcoded URLs in tests
- ❌ console.error with user data
- ❌ setTimeout without cleanup ref
- ❌ Multiple builds without @architect
- ❌ Implementing before spec is clear
- ❌ `git add .` without reviewing changes
- ❌ Batching unrelated changes in one commit

---

## Agent Orchestration

**Claude Code as conductor:** Main Claude directs specialized agents, each doing ONE thing well.

```
Human request → Claude Code (orchestrator)
    ├── @spec → defines what
    ├── @build → writes code
    ├── @ops → commits + PR + deploy verify
    ├── @test + @review (parallel)
    └── Report to human
```

**Key separation:**
- @build writes code, never commits
- @ops commits atomically, never writes app code
- Each agent has clear responsibility boundary

---

## Velocity Metrics

| Metric | Target | Phase 1 | Phase 2 Goal |
|--------|--------|---------|--------------|
| Pivots per feature | 0-1 | 2 | 0 |
| CI failures | 0 | 4 | 0 |
| Avg CI time | <5m | 3.1m | <3m |
| Tests | >100 | 145 | 200+ |
| Context lines loaded | <500 | ~2300 | ~650 |

### Phase 1 Root Causes (Resolved)

| Issue | Time Lost | Resolution |
|-------|-----------|------------|
| Missing "Why This Approach" in spec | ~40min | Added to spec template |
| Platform quirks undocumented | ~30min | Added to LEARNINGS + spec template |
| Context duplication | ~20min/session | Consolidated (92% reduction) |
| Sequential execution | ~15min/feature | PARALLEL BY DEFAULT in CLAUDE.md |

**Projected Phase 2 improvement: 47% faster implementation**

---

## Session Archive

Historical session notes in `.claude/archive/`:
- `REFLECTION-PHASE1.md` - Phase 1 retrospective
- `REFLECTION-SESSION-2026-01-04.md` - CI/CD optimization session

Full session logs preserved in git history for reference.

---

*Auto-update: Extract patterns here, archive sessions after 2 weeks*
