# Contributing to Villa

Welcome! Villa is built by a community of privacy advocates, developers, and designers.

## Quick Start

1. Read [BACKLOG.md](../BACKLOG.md) to see what needs doing
2. Check [specs/](../specs/) to understand current work
3. Pick something that matches your skills
4. Open a PR or issue

## For Testers

We need people to test on different devices and find bugs!

**How to help:**
- Test the app on your device (iOS, Android)
- Try to break things (within reason)
- Report bugs via [GitHub Issues](https://github.com/rockfridrich/villa/issues)
- Use the `testing` label

**Good testing tasks:**
- Different browsers (Safari, Chrome, Firefox)
- Different devices (various iPhones, Android phones)
- Edge cases (offline, slow network, biometric failures)
- Accessibility (screen readers, keyboard navigation)

## For Developers

**Setup:**
```bash
git clone https://github.com/rockfridrich/villa.git
cd villa
npm install
cp .env.example .env.local
npm run dev
```

**Workflow:**
1. Read the spec for what you're building
2. Write tests first (E2E for user flows)
3. Implement the feature
4. Run security checklist
5. Open PR

**Using AI agents:**
- `@spec "Create spec for X"` — Write a new spec
- `@build "Implement X"` — Build from spec
- `@test "Test X"` — Run E2E + security tests
- `@review "Review PR"` — Code review

**Code standards:**
- TypeScript strict mode
- CLEAN, SOLID, DRY principles
- Tests required for all features
- Security checklist for every PR

## For Designers

**Tools:** We use Figma, Lovable, 21st.dev, v0 for design work.

**How to contribute:**
1. Read the spec you want to design for
2. Follow [specs/design-system.md](../specs/design-system.md) (Tailwind)
3. Create designs in your tool of choice
4. Link designs in the spec or create an issue
5. Discuss with the community

**Design principles:**
- Privacy-first (no dark patterns)
- Mobile-first
- Accessible (WCAG 2.1 AA)
- Calm technology (no engagement hacking)

## Finding Work

### Good First Issues

Look for the `good-first-issue` label — these are great starting points.

### Help Wanted

The `help-wanted` label means we actively need community help.

### Discussions

Want to propose something? Use the `discussion` label or open an issue.

## Pull Request Process

1. **Before coding:** Check there's a spec or open an issue to discuss
2. **Branch:** Create from `main`, name it `feat/description` or `fix/description`
3. **Code:** Follow the spec, write tests, run security checklist
4. **PR:** Reference the spec/issue, describe your changes
5. **Review:** Address feedback, get approval
6. **Merge:** Squash and merge when approved

## Security

Found a security issue? **Do NOT** create a public issue.

See [docs/security.md](security.md) for how to report privately.

## Questions?

- **GitHub Issues:** For bugs, features, discussions
- **Telegram:** [t.me/proofofretreat](https://t.me/proofofretreat) for chat

Thank you for contributing to privacy-first identity!
