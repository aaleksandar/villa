# Villa Development Reflection Schedule

**Created:** 2026-01-06
**Purpose:** Optimize learning through structured reflection

---

## Daily Schedule

### Morning (Start of Session)
**Trigger:** First message of the day
**Action:** Ask user for daily goals

```
Good morning! Before we start:
1. What are your top 3 goals for today?
2. Any blockers from yesterday to address?
3. Which workstreams should agents focus on?
```

### Evening (End of Session)
**Trigger:** User says "wrap up" or session >4 hours
**Action:** Store reflection automatically

```
Session complete. Storing reflection...
- What shipped today
- Tokens spent / time elapsed
- What worked well
- What to improve
- Tomorrow's priorities
```

---

## Weekly Schedule

### Monday Morning
**Trigger:** First message on Monday
**Action:** Weekly reflection and planning

```
Happy Monday! Weekly sync:
1. What shipped last week?
2. What blocked progress?
3. What did we learn?
4. Sprint priorities for this week?
5. Any architecture decisions needed?
```

---

## Reflection Storage

**Location:** `.claude/reflections/`
**Naming:** `YYYY-MM-DD-{type}.md`
- `2026-01-06-daily.md`
- `2026-01-06-weekly.md`
- `2026-01-06-sprint-retro.md`

---

## Metrics to Track

| Metric | How | Goal |
|--------|-----|------|
| Tokens spent | Sum from session | Minimize per feature |
| Time elapsed | Session duration | <4 hours per session |
| Features shipped | Commits to main | 1+ per session |
| Test coverage | pnpm test | >80% |
| Beta uptime | Health check | 100% |
| Agent parallelization | Track concurrent | Find optimal (2-4) |

---

## Auto-Notification Triggers

1. **Session Start** - Check if Monday (weekly) or new day (daily goals)
2. **Session End** - Auto-store reflection
3. **Deploy Success** - Record in reflection
4. **Test Failure** - Add to "blockers" section
5. **PR Merged** - Update "shipped" section
