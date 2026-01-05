# Spec: Developer Portal Polish

**Status:** ACTIVE
**Owner:** @build
**Priority:** P1

---

## Why

developers.villa.cash exists but lacks navigation UX:
- No sidebar for quick section jumping
- No mobile navigation
- No live SDK demo embed
- Developers can't easily find what they need

---

## UI Boundaries

### Sidebar Navigation
**Behavior:**
- Fixed on left (desktop)
- Sticky, scrolls with content
- Highlights current section
- Smooth scroll to section on click

**Sections:**
1. Getting Started
2. Installation
3. Quick Start
4. API Reference
5. Components
6. AI Integration

### Mobile Navigation
**Behavior:**
- Hamburger icon in header
- Slide-in drawer from left
- Same sections as sidebar
- Closes on selection

### Live Demo Embed
**Behavior:**
- Iframe showing SDK demo
- "Try it" button opens modal
- Shows auth flow in action
- Sandbox environment

---

## Tasks

### Pre-Implementation
- [ ] Write Sidebar component test
- [ ] Write MobileNav component test
- [ ] Write navigation E2E test

### Implementation
- [ ] Create `Sidebar.tsx` component
- [ ] Create `MobileNav.tsx` component
- [ ] Add hamburger icon to header
- [ ] Update `layout.tsx` with sidebar
- [ ] Add section IDs to `page.tsx`
- [ ] Create `DemoModal.tsx` for live demo

### Post-Implementation
- [ ] E2E navigation test
- [ ] Mobile responsive test
- [ ] Lighthouse accessibility audit

---

## Test Specifications

### Sidebar Tests
```typescript
describe('Sidebar', () => {
  it('renders all section links')
  it('highlights active section')
  it('scrolls to section on click')
  it('updates on scroll position')
})
```

### MobileNav Tests
```typescript
describe('MobileNav', () => {
  it('opens on hamburger click')
  it('closes on link click')
  it('closes on outside click')
  it('has correct ARIA attributes')
})
```

### E2E Navigation Tests
```typescript
test('sidebar navigation', async ({ page }) => {
  await page.goto('/');
  await page.click('text=API Reference');
  await expect(page.locator('#api-reference')).toBeInViewport();
});

test('mobile navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.click('[aria-label="Open menu"]');
  await expect(page.locator('[role="dialog"]')).toBeVisible();
});
```

---

## Design Reference

**Inspiration:**
- Vercel Docs sidebar
- shadcn/ui docs navigation
- Radix UI section highlighting

**Colors:**
- Background: `bg-cream-50`
- Active link: `text-ink font-medium`
- Inactive link: `text-ink-muted`
- Hover: `bg-cream-100`

---

## Acceptance Criteria

1. Sidebar visible on desktop (>768px)
2. Mobile nav works on mobile (<768px)
3. Section highlighting on scroll
4. Smooth scroll to sections
5. All links functional
6. ARIA compliant
7. E2E tests passing

---

## Effort Estimate

| Task | Size |
|------|------|
| Write tests | S |
| Sidebar component | M |
| Mobile nav | M |
| Integration | S |
| E2E tests | S |
| **Total** | **M** (3-4 hours) |
