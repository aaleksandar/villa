# Development Rules

Simple rules for consistent, secure, performant development.

## Code Quality Principles

### CLEAN Code
- **Readable:** Code reads like well-written prose. Names reveal intent.
- **Small functions:** Each function does one thing. If you need comments to explain what, refactor.
- **No magic:** No magic numbers, no hidden dependencies, no implicit behavior.
- **Fail fast:** Validate early, fail with clear errors, never silently corrupt state.

### SOLID
- **Single Responsibility:** One reason to change per module/class/function.
- **Open/Closed:** Extend behavior without modifying existing code.
- **Liskov Substitution:** Subtypes must be substitutable for their base types.
- **Interface Segregation:** Small, focused interfaces over large general ones.
- **Dependency Inversion:** Depend on abstractions, not concretions. Inject dependencies.

### DRY (Don't Repeat Yourself)
- Extract repeated logic into shared functions/hooks.
- Single source of truth for constants, types, validation rules.
- But: prefer duplication over wrong abstraction. Don't abstract prematurely.

### Performance by Design
- **Memory conscious:** Avoid unnecessary allocations. Clean up subscriptions, timers, listeners.
- **Algorithm awareness:** Know your Big-O. Prefer O(1) or O(log n) lookups. Avoid O(n²) in hot paths.
- **Bundle size:** Tree-shake. Lazy load. No giant dependencies for small features.
- **Mobile-first:** Assume 3G, assume limited RAM, assume battery matters.

### Latency Budgets
- **User input response:** <100ms (feels instant)
- **Navigation/transitions:** <300ms
- **Content load:** <1s perceived, <3s actual
- **Background operations:** Don't block UI. Use web workers for heavy compute.

### Hardware Constraints
- **Passkeys:** Secure enclave operations may take 100-500ms. Show feedback.
- **Camera/biometrics:** Request permissions gracefully. Handle denial.
- **Storage:** IndexedDB for structured data, not localStorage. Respect quota.
- **Network:** Offline-first. Queue operations. Sync when available.

## Spec Rules

**Specs before code.** Every implementation traces to a spec in `specs/features/`. No spec = no code.

**Specs are binding.** Don't improvise. If the spec is unclear, ask. If you discover a gap, propose an amendment in the PR.

**One spec format.** All features use the template in `.claude/templates/feature-spec.md`.

## Design Rules

**Humans own design.** UI/UX is created by humans using Figma, 21st.dev, Lovable, or similar tools.

**Design system is reference.** Follow patterns in `specs/design-system.md` for consistency.

**Accessibility by default.** WCAG 2.1 AA minimum. Test with screen readers.

## Implementation Rules

**Mocks first.** Before implementing any external integration, create mocks in `mocks/` covering success, error, timeout, and offline scenarios.

**TDD.** Write failing tests first. Tests map to acceptance criteria. Format: `// Spec: feature-name - AC-1`.

**No console.log.** Use structured logging. Pre-commit hooks will block.

**Handle errors.** Never swallow errors. Use Result pattern for operations that can fail.

## Security Rules

**No secrets in code.** Use environment variables. Pre-commit hooks scan for leaks.

**Validate input.** All user input is untrusted. Use Zod schemas at boundaries.

**Approved crypto only.** Use libsodium or noble-curves. Never roll your own crypto.

**Privacy by default.** Data stays on device unless user explicitly consents.

## Git Rules

**Branch naming.** `feat/{feature-name}`, `fix/{issue}`, `docs/{topic}`

**Commit format.** `feat(scope): description [feature-name]`

**PR size.** Max 400 lines. Split larger changes.

**Security checklist.** Complete `.claude/templates/security-checklist.md` before requesting review.

## Handoff Rules

**Update STATUS.md.** After completing work, update `specs/STATUS.md`.

**One task at a time.** Finish current work before starting new work.

**Human gates.** Spec approval and PR merge require human sign-off.
