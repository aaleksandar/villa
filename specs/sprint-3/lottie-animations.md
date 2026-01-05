# Spec: Lottie Animation Integration

**Status:** ACTIVE
**Owner:** @design
**Priority:** P1

---

## Why

Villa has Lottie infrastructure (`lottie-animation.tsx`) but 0 animation files. Adding loading, success, and empty state animations:
- Increases perceived performance (loading feels faster)
- Celebrates user actions (success moment)
- Makes empty states less jarring

---

## UI Boundaries

### Loading Animation
**Use Cases:**
- Page transitions
- API calls in progress
- Button loading state

**Specs:**
- Duration: 1-2 second loop
- Style: Minimal, matches Villa cream/ink palette
- Size: 48x48px default, scalable
- Motion: Smooth, not distracting

### Success Animation
**Use Cases:**
- Auth complete
- Profile saved
- Action confirmed

**Specs:**
- Duration: 1.5-2 seconds, plays once
- Style: Celebratory but subtle (checkmark + particles)
- Size: 120x120px
- Motion: Satisfying "pop" effect

### Empty State Animation
**Use Cases:**
- No results found
- First-time user
- Cleared list

**Specs:**
- Duration: 3-4 second loop
- Style: Friendly illustration with gentle motion
- Size: 200x200px
- Motion: Subtle breathing/floating effect

---

## Tasks

### Pre-Implementation
- [ ] Source animations from LottieFiles (free tier)
- [ ] Write loading animation test
- [ ] Write success animation test
- [ ] Mock animation JSON for tests

### Implementation
- [ ] Download/create `loading.json`
- [ ] Download/create `success.json`
- [ ] Download/create `empty.json`
- [ ] Update `loading-animation.tsx` to use Lottie
- [ ] Create `success-animation.tsx` Lottie variant
- [ ] Update `empty-state.tsx` with Lottie option

### Post-Implementation
- [ ] E2E visual regression test
- [ ] Verify reduced motion fallback
- [ ] Document animation usage

---

## Test Specifications

### Loading Animation Tests
```typescript
describe('LoadingAnimation', () => {
  it('renders Lottie animation')
  it('loops continuously')
  it('respects reduced motion (shows static)')
  it('accepts custom size prop')
})
```

### Success Animation Tests
```typescript
describe('SuccessAnimation', () => {
  it('plays animation once')
  it('calls onComplete when finished')
  it('respects reduced motion')
})
```

### Empty State Tests
```typescript
describe('EmptyState with Lottie', () => {
  it('renders animation when provided')
  it('falls back to icon when no animation')
  it('respects reduced motion')
})
```

---

## Animation Sources

| Animation | Source | License |
|-----------|--------|---------|
| Loading | LottieFiles Free | Lottie Simple License |
| Success | LottieFiles Free | Lottie Simple License |
| Empty | LottieFiles Free | Lottie Simple License |

**Search terms:**
- Loading: "minimal loader", "spinner", "dots loading"
- Success: "checkmark success", "celebration", "confetti simple"
- Empty: "empty box", "no results", "not found friendly"

---

## Acceptance Criteria

1. 3 Lottie JSON files in `public/animations/`
2. Components use Lottie instead of CSS animations
3. All respect `useReducedMotion()`
4. Unit tests passing
5. Visual regression passing
6. Bundle size <50KB per animation

---

## Effort Estimate

| Task | Size |
|------|------|
| Source animations | S |
| Write tests | S |
| Integrate loading | S |
| Integrate success | S |
| Integrate empty | S |
| **Total** | **M** (2-3 hours) |
