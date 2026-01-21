# Spec: shadcn/ui Component Integration

**Status:** ACTIVE
**Owner:** @build
**Priority:** P0

---

## Why

Villa has 0 shadcn/ui components despite design principles recommending them. Adding Dialog, Tooltip, and Tabs provides:
- Accessible primitives (ARIA compliant)
- Consistent design language
- Reduced custom code maintenance

---

## UI Boundaries

### Dialog Component
**Use Cases:**
- Confirmation modals ("Are you sure?")
- Settings panels
- Error details

**Behavior:**
- Opens centered, dims background
- Closes on Escape or backdrop click
- Focus trapped inside
- Smooth enter/exit animation

### Tooltip Component
**Use Cases:**
- Icon button explanations
- Truncated text full display
- Help hints

**Behavior:**
- Shows on hover (desktop) / tap (mobile)
- 200ms delay before show
- Positions auto (prefers top)
- Max width 200px

### Tabs Component
**Use Cases:**
- Settings sections
- Developer portal navigation
- Code examples (TypeScript/JavaScript)

**Behavior:**
- Horizontal tab list
- Keyboard navigable (arrow keys)
- Active tab indicator
- Content panels below

---

## Tasks

### Pre-Implementation
- [ ] Add shadcn CLI to devDependencies
- [ ] Create `components.json` config
- [ ] Write Dialog unit test
- [ ] Write Tooltip unit test
- [ ] Write Tabs unit test

### Implementation
- [ ] `npx shadcn@latest add dialog`
- [ ] `npx shadcn@latest add tooltip`
- [ ] `npx shadcn@latest add tabs`
- [ ] Customize to Villa design tokens

### Post-Implementation
- [ ] Export from `ui/index.ts`
- [ ] Add E2E test for Dialog
- [ ] Update developers portal with Tabs
- [ ] Document usage in Storybook (future)

---

## Test Specifications

### Dialog Tests (Vitest)
```typescript
describe('Dialog', () => {
  it('opens when trigger clicked')
  it('closes on Escape key')
  it('closes on backdrop click')
  it('traps focus inside')
  it('returns focus on close')
})
```

### Tooltip Tests (Vitest)
```typescript
describe('Tooltip', () => {
  it('shows on hover after delay')
  it('hides on mouse leave')
  it('positions above trigger by default')
  it('respects reduced motion')
})
```

### Tabs Tests (Vitest)
```typescript
describe('Tabs', () => {
  it('shows first tab content by default')
  it('switches tab on click')
  it('supports keyboard navigation')
  it('has correct ARIA attributes')
})
```

---

## Acceptance Criteria

1. All 3 components installed and customized
2. Unit tests passing (6+ tests)
3. E2E test for Dialog interaction
4. Exported from `@/components/ui`
5. No accessibility violations (axe-core)

---

## Effort Estimate

| Task | Size |
|------|------|
| Setup shadcn CLI | XS |
| Write tests | S |
| Install components | S |
| Customize tokens | S |
| E2E tests | S |
| **Total** | **M** (2-3 hours) |
