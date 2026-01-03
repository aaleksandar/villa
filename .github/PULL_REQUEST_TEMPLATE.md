# Pull Request

## Spec Reference

**Engineering Spec:** ENG-XXX
**UX Spec:** UX-XXX (if applicable)
**User Journey:** UJ-XXX

## Summary

{Brief description of what this PR does}

## Changes

{List the key changes made}

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist

### Spec Compliance
- [ ] All changes trace to spec requirements
- [ ] No functionality outside spec scope
- [ ] Spec updates included if implementation required changes

### Code Quality
- [ ] TypeScript strict mode passes
- [ ] No `any` types without justification
- [ ] Error handling is explicit
- [ ] No console.log statements

### Security
- [ ] No secrets in code
- [ ] Input validation at boundaries
- [ ] Privacy requirements followed
- [ ] Security checklist completed (`.claude/templates/security-checklist.md`)

### Tests
- [ ] Tests trace to spec requirements (using `// Spec: XXX` comments)
- [ ] All error paths tested
- [ ] Mocks from `mocks/` directory used (no ad-hoc mocks)
- [ ] Coverage meets requirements

### Documentation
- [ ] STATUS.md updated
- [ ] README updated if needed
- [ ] Code comments explain "why" not "what"

## AI Assistance

- [ ] This PR was created with AI assistance
- Prompts/context given: {describe}

## Notes for Reviewers

{Any additional context or areas to focus on}
