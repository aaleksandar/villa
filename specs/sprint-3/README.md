# Sprint 3: UI Polish & Iframe Integration

**Duration:** 2026-01-06 to 2026-01-12
**Goal:** Ship shadcn/ui components, Lottie animations, and complete iframe auth flow

---

## Sprint Objectives

1. **UI Foundation** - Add shadcn/ui primitives (Dialog, Tooltip, Tabs)
2. **Animation Polish** - Add Lottie animations for loading, success, empty states
3. **Iframe Completion** - Wire SDK screens to Porto auth flow
4. **Developer Portal** - Add sidebar nav and mobile menu

---

## Work Units (Parallel Streams)

### Stream A: shadcn/ui Components
**Owner:** @build (Terminal 1)
**Files:** `apps/web/src/components/ui/` (new files only)
**Spec:** `specs/sprint-3/shadcn-components.md`

### Stream B: Lottie Animations
**Owner:** @design (Terminal 2)
**Files:** `apps/web/public/animations/`, `apps/web/src/components/ui/`
**Spec:** `specs/sprint-3/lottie-animations.md`

### Stream C: Developers Portal
**Owner:** @build (Terminal 3)
**Files:** `apps/developers/src/`
**Spec:** `specs/sprint-3/developers-polish.md`

### Stream D: Design Token Fixes
**Owner:** @build (Quick - same terminal)
**Files:** `apps/web/src/components/ui/empty-state.tsx`
**Spec:** Inline (simple fix)

---

## File Ownership Matrix

| Stream | Creates | Modifies | Read-Only |
|--------|---------|----------|-----------|
| A | `dialog.tsx`, `tooltip.tsx`, `tabs.tsx` | `ui/index.ts` | - |
| B | `public/animations/*.json` | `loading-animation.tsx` | - |
| C | `Sidebar.tsx`, `MobileNav.tsx` | `layout.tsx`, `page.tsx` | - |
| D | - | `empty-state.tsx` | - |

**No conflicts** - Each stream owns distinct files.

---

## Success Criteria

- [ ] 3+ shadcn components added and tested
- [ ] 3 Lottie animations (loading, success, empty)
- [ ] Developers portal has sidebar navigation
- [ ] All E2E tests pass
- [ ] Deployed to beta.villa.cash
- [ ] Reflection stored

---

## Test-First Approach

1. Write component test (Vitest)
2. Write E2E test (Playwright)
3. Implement component
4. Verify tests pass
5. Commit

---

## Branch Strategy

```
main
  └── release/v0.3.0
        ├── feat/shadcn-dialog
        ├── feat/shadcn-tooltip
        ├── feat/lottie-loading
        └── feat/developers-sidebar
```

All feature branches merge to `release/v0.3.0`, then release merges to `main`.
