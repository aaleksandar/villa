# Product Spec: Villa Infrastructure Telemetry Dashboard

**Source:** User request + existing `apps/telemetry/` codebase analysis
**Created:** 2026-01-22
**Product Lead:** @product

---

## Executive Summary

A **local development tool** for Villa developers and AI agents to quickly diagnose infrastructure issues, verify deployments, and access debugging information. Unlike production monitoring tools, this is optimized for **developer workflow integration** and **AI-readable output** for human-AI collaboration during debugging sessions.

**Key insight:** The current implementation fails because browser `fetch()` can't make cross-origin requests to remote APIs. The fix is simple: move API calls server-side.

---

## User Personas

### Persona 1: Human Developer (Villa Team)

**Name:** Dev (Villa contributor)
**Context:** Working on Villa codebase, needs to verify deployments work

**Characteristics:**

- Uses `bun dev` for local development
- Deploys via git push to main
- May have multiple terminals/tabs open
- Wants **instant answers**, not dashboards to study

**Frustrations:**

- "Did my deploy actually go out?"
- "Is staging broken or is it my code?"
- "What commit is production running?"
- "Why is CI failing?"

**Workflows:**

1. Push code → Wait → Check if deployed → Debug if not
2. See error in app → Check if it's infrastructure vs code
3. Prepare for release → Verify staging matches expectations

### Persona 2: AI Agent (Claude, Cursor, Copilot)

**Name:** AI Assistant working with Villa codebase
**Context:** Helping user debug issues, verify deployments, understand system state

**Characteristics:**

- Can read JSON, plain text, markdown
- Prefers structured data over visual-only information
- Can call APIs but not use browsers interactively
- Needs actionable context, not pretty charts

**Frustrations:**

- Visual-only dashboards (can't read screenshots reliably)
- Data behind authentication walls
- Information spread across multiple tools
- No single "what's the current state?" endpoint

**Workflows:**

1. User asks "is staging working?" → Agent needs to check programmatically
2. User asks "why did deploy fail?" → Agent needs CI logs + context
3. User asks "what's deployed where?" → Agent needs version comparison

---

## Jobs to Be Done

### Primary Job: Verify Deployment Status

**When I...** push code and want to confirm it deployed correctly
**I want to...** see at a glance what version is running where
**So I can...** know if I need to debug or can continue other work

**Success Criteria:**

- [ ] Can see deployed commit SHA for all environments in <5 seconds
- [ ] Can tell if staging and production are in sync
- [ ] Can identify which environment is broken without clicking around

### Secondary Jobs

| Job                     | Context                                   | Desired Outcome                        | Priority |
| ----------------------- | ----------------------------------------- | -------------------------------------- | -------- |
| Diagnose CI failures    | Deploy stuck or failing                   | Link directly to failing CI run        | P1       |
| Check service health    | Something seems broken                    | See if it's infrastructure vs code     | P2       |
| Access debugging tools  | Need to investigate deeper                | One-click to logs, SSH, DB console     | P2       |
| Get AI-readable summary | AI agent helping debug                    | Structured JSON with full context      | P1       |
| Compare environments    | "Why does staging work but prod doesn't?" | Side-by-side version/config comparison | P3       |

---

## User Value Matrix

| Feature            | User Sees              | User Gets                            | User Never Knows                  |
| ------------------ | ---------------------- | ------------------------------------ | --------------------------------- |
| Deployment Status  | Green/yellow/red cards | Instant deployment verification      | CORS workarounds, API aggregation |
| Version Comparison | Table with SHA, hash   | "Are environments in sync?" answered | Build hash calculation            |
| CI Pipeline Status | Latest run with ✓/✗    | Link to fix failing builds           | GitHub API complexity             |
| AI Endpoint        | (Nothing in UI)        | AI can diagnose issues               | JSON formatting, caching          |
| Quick Actions      | Buttons/links          | Direct access to debugging tools     | SSH tunnel mechanics              |

---

## Technical Constraints (Why Current Implementation Fails)

### The CORS Problem

**Current approach (broken):**

```
Browser → fetch("https://villa.cash/api/health") → CORS blocked
```

**Why it fails:** Browser security prevents cross-origin requests. Remote servers don't have CORS headers for localhost.

**Solution:**

```
Browser → Next.js API Route → Server-side fetch → Remote API
                 ↑
         No CORS issues (server-to-server)
```

### Data Sources That Work

| Source               | Method                  | What We Get                          |
| -------------------- | ----------------------- | ------------------------------------ |
| **GitHub API**       | `gh` CLI or `octokit`   | CI status, commits, PRs, actions     |
| **Health Endpoints** | Server-side fetch       | Version, uptime, memory usage        |
| **Git Local**        | `git log`, `git status` | Current branch, uncommitted changes  |
| **DigitalOcean API** | `doctl` or REST         | App status, deployment logs (future) |
| **Local services**   | localhost fetch         | Dev server health                    |

### Data Sources That DON'T Work (from browser)

- Direct fetch to `villa.cash` (CORS)
- Direct fetch to `beta.villa.cash` (CORS)
- Any cross-origin API without CORS headers

---

## MVP Feature Scope (P0: Day 1)

### Must Have

1. **Server-Side API Aggregation**
   - `/api/status` endpoint that fetches all health data server-side
   - Returns unified JSON response
   - 30-second caching to avoid rate limits

2. **GitHub CI Status**
   - Show latest CI run status (pass/fail/running)
   - Show latest Deploy workflow status
   - Link to GitHub Actions page

3. **Environment Health Cards**
   - Local (localhost:3000)
   - Staging (beta.villa.cash)
   - Production (villa.cash)
   - Each shows: status, version, SHA, last deploy time

4. **Build Comparison**
   - Are staging and production on same commit?
   - Visual indicator for drift (yellow = different, green = same)

5. **AI-Readable Endpoint**
   - `/api/telemetry/status.json` - Full structured data
   - `/api/telemetry/status.txt` - Plain text summary
   - No auth required (local tool only)

### Nice to Have (P1: Week 1)

6. **Quick Actions Panel**
   - Link to GitHub Actions
   - Link to DigitalOcean dashboard
   - Link to pull requests
   - "View logs" button (opens DO console)

7. **Git Status Panel**
   - Current branch
   - Uncommitted changes count
   - Last commit message

### Future (P2+)

8. SSH tunnel management (start/stop tunnels to staging DB)
9. Log streaming (live tail of app logs)
10. Deployment triggers (redeploy staging from dashboard)
11. Environment variable viewer (masked secrets)

---

## Screen Specifications

### Screen: Main Dashboard

**Purpose:** Single-glance infrastructure status
**Entry conditions:** User opens `localhost:3003`
**Exit conditions:** User clicks external link or closes tab

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  Villa Telemetry                           [Refresh] [⚙️]   │
│  Last updated: 2:34 PM                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ LOCAL       │  │ STAGING     │  │ PRODUCTION  │         │
│  │ ● Running   │  │ ● Running   │  │ ● Running   │         │
│  │ v0.4.2      │  │ v0.4.2      │  │ v0.4.1      │         │
│  │ sha:cbefe7c │  │ sha:cbefe7c │  │ sha:53004a6 │   ⚠️    │
│  │ 2m ago      │  │ 15m ago     │  │ 2h ago      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ CI/CD Pipeline                                        │  │
│  │ CI Pipeline: ✗ FAILED (cbefe7c) - View logs →        │  │
│  │ Deploy:      ⏳ In Progress (cbefe7c)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Build Comparison                                      │  │
│  │ ⚠️ Production is 2 commits behind staging             │  │
│  │    Production: 53004a6 | Staging: cbefe7c             │  │
│  │    [View diff on GitHub →]                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Quick Links: [Actions] [DigitalOcean] [PRs] [Issues]      │
│                                                             │
│  ──────────────────────────────────────────────────────    │
│  AI Endpoint: http://localhost:3003/api/telemetry/status   │
└─────────────────────────────────────────────────────────────┘
```

**States:**

| State     | Visual                                    | Behavior                       |
| --------- | ----------------------------------------- | ------------------------------ |
| Loading   | Skeleton cards, spinner                   | Fetching initial data          |
| All Green | Green dots, "All systems operational"     | Normal state                   |
| Warning   | Yellow dot on drifted env, warning banner | Shows what's different         |
| Error     | Red dot on failed env, error details      | Shows error message + recovery |
| Offline   | Gray cards, "Cannot reach telemetry API"  | Suggests checking local server |

**Copy Standards:**

| Element       | Text                                      | Notes                        |
| ------------- | ----------------------------------------- | ---------------------------- |
| Headline      | "Villa Telemetry"                         | Matches existing             |
| Subhead       | "Infrastructure status for humans and AI" | New - clarifies purpose      |
| Status badge  | "Running" / "Error" / "Unknown"           | Clear, not technical         |
| Drift warning | "Production is X commits behind staging"  | Actionable, not scary        |
| AI endpoint   | "AI Endpoint: {url}"                      | Help AI agents find the data |

---

## API Specifications

### GET `/api/telemetry/status`

**Purpose:** Unified status for dashboard UI and AI consumption

**Response (JSON):**

```json
{
  "timestamp": "2026-01-22T14:34:00Z",
  "summary": "2 healthy, 1 warning (production outdated)",
  "environments": {
    "local": {
      "status": "healthy",
      "url": "http://localhost:3000",
      "version": "0.4.2",
      "sha": "cbefe7c",
      "uptime": "2m",
      "latency_ms": 45
    },
    "staging": {
      "status": "healthy",
      "url": "https://beta.villa.cash",
      "version": "0.4.2",
      "sha": "cbefe7c",
      "uptime": "15m",
      "latency_ms": 120
    },
    "production": {
      "status": "warning",
      "warning": "2 commits behind staging",
      "url": "https://villa.cash",
      "version": "0.4.1",
      "sha": "53004a6",
      "uptime": "2h",
      "latency_ms": 95
    }
  },
  "ci": {
    "latest_run": {
      "workflow": "CI Pipeline",
      "status": "failure",
      "sha": "cbefe7c",
      "url": "https://github.com/rockfridrich/villa/actions/runs/12345",
      "created_at": "2026-01-22T14:29:13Z"
    },
    "deploy": {
      "workflow": "Deploy",
      "status": "in_progress",
      "sha": "cbefe7c",
      "url": "https://github.com/rockfridrich/villa/actions/runs/12346"
    }
  },
  "git": {
    "branch": "main",
    "sha": "cbefe7c",
    "message": "fix(telemetry): resolve React hydration error",
    "uncommitted_changes": 0
  },
  "comparison": {
    "staging_vs_production": {
      "in_sync": false,
      "commits_behind": 2,
      "diff_url": "https://github.com/rockfridrich/villa/compare/53004a6...cbefe7c"
    }
  },
  "actions": {
    "github_actions": "https://github.com/rockfridrich/villa/actions",
    "digitalocean": "https://cloud.digitalocean.com/apps",
    "pull_requests": "https://github.com/rockfridrich/villa/pulls"
  }
}
```

### GET `/api/telemetry/status.txt`

**Purpose:** Plain text for quick terminal/AI consumption

**Response:**

```
Villa Infrastructure Status
===========================
Generated: 2026-01-22 14:34:00 UTC

ENVIRONMENTS
------------
Local:      ● HEALTHY  v0.4.2  sha:cbefe7c  (2m uptime)
Staging:    ● HEALTHY  v0.4.2  sha:cbefe7c  (15m uptime)
Production: ⚠ WARNING  v0.4.1  sha:53004a6  (2h uptime)
            └─ 2 commits behind staging

CI/CD
-----
CI Pipeline: ✗ FAILED   sha:cbefe7c
Deploy:      ⏳ RUNNING  sha:cbefe7c

QUICK ACTIONS
-------------
- View failing CI: https://github.com/rockfridrich/villa/actions/runs/12345
- View deploy: https://github.com/rockfridrich/villa/actions/runs/12346
- Compare versions: https://github.com/rockfridrich/villa/compare/53004a6...cbefe7c
```

---

## User Flows

### Flow 1: "Is my deploy working?"

**Entry Point:** Developer just pushed to main
**Happy Path:**

1. Developer opens `localhost:3003` (or has it open)
2. Dashboard auto-refreshes (or they click Refresh)
3. Developer sees CI Pipeline: ✓ SUCCESS
4. Developer sees Deploy: ⏳ IN PROGRESS
5. After 2-3 minutes, sees Production card update with new SHA
6. Developer confirms new SHA matches their commit
7. Done - deploy verified

**Error Paths:**
| Trigger | User Sees | Recovery Action |
|---------|-----------|-----------------|
| CI fails | Red "FAILED" badge + link | Click link to view logs, fix issue |
| Deploy times out | Yellow "STALLED" badge | Click to view DO logs |
| Health check fails | Red card on environment | Check error message, investigate |

### Flow 2: AI Agent Debugging

**Entry Point:** User asks Claude "Why isn't my code showing up on staging?"
**Happy Path:**

1. AI agent fetches `localhost:3003/api/telemetry/status`
2. AI parses JSON response
3. AI sees: CI failed on latest commit
4. AI tells user: "Your CI pipeline failed on commit cbefe7c. Here's the link to the failing run: [url]. The error is likely in the test suite based on the workflow name."
5. User clicks link, sees the specific failure
6. AI can help debug the specific test failure

**AI needs:**

- Structured data (JSON or plain text)
- URLs to external resources
- Clear status summaries
- Comparison information

### Flow 3: Environment Drift Investigation

**Entry Point:** User notices production behaving differently than staging
**Happy Path:**

1. User opens telemetry dashboard
2. Sees warning: "Production is 2 commits behind staging"
3. Clicks "View diff on GitHub"
4. Reviews the 2 commits that differ
5. Decides whether to deploy or investigate

---

## Success Metrics

| Metric           | Definition                                                 | Target                          | Tracking Method                   |
| ---------------- | ---------------------------------------------------------- | ------------------------------- | --------------------------------- |
| Time to diagnose | How long from "something's wrong" to identifying the issue | <60 seconds                     | Self-reported                     |
| Dashboard usage  | How often developers check the dashboard                   | Daily during active development | Could add anonymous usage counter |
| AI success rate  | Can AI agent answer infra questions?                       | 90% without human intervention  | Manual testing                    |
| False positives  | Dashboard shows error when none exists                     | <5% of checks                   | Bug reports                       |

---

## Anti-Requirements (What This Should NOT Do)

1. **NOT a production monitoring tool**
   - No alerting, no PagerDuty integration, no SLO tracking
   - Vercel/Datadog are better for that

2. **NOT require authentication**
   - This is a local-only tool on port 3003
   - Adding auth would slow down the workflow

3. **NOT store historical data**
   - No database, no time-series charts
   - Just current state, always fresh

4. **NOT replace GitHub Actions UI**
   - Don't show full logs, just status and links
   - GitHub's UI is better for deep CI debugging

5. **NOT expose secrets**
   - Even locally, don't show API keys or credentials
   - Environment names yes, values no

6. **NOT deploy to production**
   - This is NOT deployed to villa.cash
   - Local development tool only

7. **NOT require external services to function**
   - Should gracefully degrade if GitHub API is down
   - Show what it can, indicate what's unavailable

---

## Interactive Features (Future)

| Feature          | User Action                      | What Happens                               | Priority |
| ---------------- | -------------------------------- | ------------------------------------------ | -------- |
| Redeploy staging | Click "Redeploy" button          | Triggers DO redeploy via API               | P2       |
| View logs        | Click "Logs" on environment card | Opens DO runtime logs                      | P2       |
| SSH tunnel       | Click "Connect to DB"            | Starts SSH tunnel, shows connection string | P3       |
| Clear cache      | Click "Clear CDN Cache"          | Purges DigitalOcean CDN                    | P3       |

**Note:** Interactive features require DigitalOcean API token. Consider adding a settings page for API credentials (stored locally only).

---

## Implementation Guidance

### Phase 1: Fix CORS (Day 1)

1. Create `/api/telemetry/status/route.ts` in `apps/telemetry`
2. Move all fetch logic server-side
3. Add GitHub API integration via `gh` CLI or Octokit
4. Update frontend to use `/api/telemetry/status`

### Phase 2: AI Endpoint (Day 2)

1. Ensure JSON response is well-structured
2. Add `/api/telemetry/status.txt` for plain text
3. Test with Claude by asking infra questions

### Phase 3: Polish (Week 1)

1. Add build comparison logic
2. Improve error messages and recovery actions
3. Add quick action links
4. Style improvements (match Villa design system)

---

## UX Components

| Component        | Source                 | Customization             |
| ---------------- | ---------------------- | ------------------------- |
| Status Card      | Custom (existing)      | Add warning state styling |
| Badge            | Tailwind               | Green/yellow/red variants |
| Quick Links      | Custom                 | Grid of icon + text links |
| Loading Skeleton | Tailwind animate-pulse | Match card dimensions     |

---

## Scope Boundaries

### In Scope (v1)

- Server-side API aggregation
- GitHub CI/CD status
- Environment health cards
- Build comparison
- AI-readable endpoints
- Quick links panel

### Out of Scope (v1)

- Historical data / charts — requires database
- Alerting — use proper monitoring tools
- Log streaming — complex, use DO console
- SSH tunnel management — security concerns
- Deployment triggers — risk of accidents

### Dependencies

- GitHub API access (via `gh` CLI, already configured)
- Remote health endpoints (must respond to server requests)
- Local development server running

---

## Success Definition

**This feature is successful when:**

1. Developers can verify deployments in <30 seconds (vs 2+ minutes with current workflow)
2. AI agents can diagnose 80%+ of common infrastructure questions without human intervention
3. Zero developers ask "is it deployed?" in Slack - they just check the dashboard

**We will validate by:**

- Manual testing of all flows
- Asking Claude to diagnose sample issues using the API
- Developer feedback after 1 week of use
