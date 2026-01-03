# Security Checklist

Use this checklist for every PR that touches authentication, authorization, cryptography, or user data.

## Pre-Commit Checks

Before committing, verify these items.

### Secrets and Credentials

- [ ] No API keys hardcoded in source files
- [ ] No private keys in code or comments
- [ ] No passwords or tokens in configuration
- [ ] No secrets in test fixtures (use environment variables)
- [ ] `.env` files are in `.gitignore`
- [ ] Pre-commit hooks pass (gitleaks scan)

### Sensitive Data

- [ ] No PII in log statements
- [ ] No wallet addresses in error messages
- [ ] No biometric data stored or transmitted
- [ ] No location data without explicit consent

## Code Review Checks

### Authentication

- [ ] All protected routes require valid Porto ID session
- [ ] Token validation happens on every request
- [ ] Session expiration is enforced
- [ ] Logout properly clears all session data
- [ ] Passkey verification follows WebAuthn spec

### Authorization

- [ ] Users can only access their own data
- [ ] Guardian relationships are verified before recovery
- [ ] Admin functions check admin role
- [ ] No horizontal privilege escalation possible
- [ ] No vertical privilege escalation possible

### Input Validation

- [ ] All user input validated at API boundary
- [ ] Validation uses Zod schemas (no manual parsing)
- [ ] File uploads checked for type and size
- [ ] URLs validated before fetch
- [ ] No SQL/NoSQL injection possible
- [ ] No command injection possible

### Cryptography

- [ ] Only approved libraries used (libsodium, noble-curves)
- [ ] Random numbers from `crypto.getRandomValues()`
- [ ] No custom cryptographic implementations
- [ ] Keys are the correct length for algorithm
- [ ] Encryption algorithms match spec requirements
- [ ] No deprecated algorithms (MD5, SHA1 for security)

### Data Protection

- [ ] Sensitive data encrypted at rest
- [ ] TLS required for all network communication
- [ ] No sensitive data in URL parameters
- [ ] No sensitive data in browser history
- [ ] Local storage does not contain secrets
- [ ] IndexedDB data is encrypted

### Error Handling

- [ ] Errors do not expose stack traces to users
- [ ] Errors do not reveal system internals
- [ ] Failed auth does not reveal if user exists
- [ ] Rate limiting on auth endpoints
- [ ] Timeouts on external requests

### Dependencies

- [ ] No known vulnerabilities in dependencies
- [ ] Dependencies are from trusted sources
- [ ] Lockfile is committed
- [ ] No unnecessary dependencies added

## ZK and Recovery-Specific Checks

### Guardian Recovery

- [ ] Guardian commitments are hashed (not plaintext)
- [ ] ZK proofs verified on-chain
- [ ] Recovery has time delay
- [ ] Owner can cancel pending recovery
- [ ] Guardian threshold enforced

### Face Recovery (Unforgettable)

- [ ] Biometric processing happens client-side only
- [ ] Raw biometric images deleted after feature extraction
- [ ] Only helper string transmitted (never biometric data)
- [ ] Multi-factor requirement enforced
- [ ] Password/object factors are not optional

### Signing Flows

- [ ] QR codes contain signed data only (no secrets)
- [ ] QR data has expiration
- [ ] Bluetooth pairing requires user confirmation
- [ ] No key material transmitted over network

## Post-Deployment Checks

- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Monitoring for security events
- [ ] Incident response plan documented

## Sign-Off

This PR has been reviewed for security compliance.

- [ ] Reviewer: {Name} - Date: {YYYY-MM-DD}
- [ ] All blocking issues resolved
- [ ] Non-blocking issues tracked in follow-up tickets
