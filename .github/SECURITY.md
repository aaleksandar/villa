# Security Policy

Villa handles sensitive identity and cryptographic data. We take security seriously and appreciate responsible disclosure of vulnerabilities.

## Reporting a Vulnerability

If you discover a security vulnerability in Villa, please report it privately rather than opening a public issue. Public disclosure of vulnerabilities before they are fixed puts all users at risk.

To report a vulnerability, send an email to security@example.com with the subject line "Villa Security Vulnerability". Include a detailed description of the vulnerability with steps to reproduce it, the potential impact and severity in your assessment, and any proof-of-concept code or screenshots that help demonstrate the issue.

We will acknowledge receipt of your report within 48 hours and provide an initial assessment within one week. We aim to release fixes for critical vulnerabilities within 30 days.

## Security Model

Villa's security relies on several key properties that contributors should understand and preserve.

Passkeys are hardware-protected, meaning the private key material never leaves the device's secure enclave. Villa code should never attempt to access, export, or log passkey material.

Biometric data stays on-device through the Unforgettable SDK integration, which processes biometric features entirely client-side. Only mathematical helper strings are ever transmitted or stored, never raw biometric images.

Guardian privacy is protected through ZK proofs, as guardian identities are never stored in plaintext. Only cryptographic commitments appear on-chain or in storage.

Local-first architecture means all personal data stays on the user's device unless they explicitly consent to sharing. The default is always privacy.

## Scope

The following are in scope for security reports: authentication and authorization vulnerabilities including bypassing passkey verification, privilege escalation, and session hijacking; cryptographic issues including weak random number generation, improper key handling, and flawed proof verification; data exposure including leaking PII in logs or errors, exposing private keys, and unauthorized data access; injection attacks including XSS, SQL or NoSQL injection, and command injection.

The following are generally out of scope but may still be worth reporting: denial of service attacks are typically out of scope unless they reveal a deeper vulnerability; social engineering and phishing attacks target users rather than the application itself; issues in dependencies should be reported to those projects unless there's a Villa-specific exploitation path.

## Security Practices for Contributors

All code changes must pass the security checklist in `.claude/templates/security-checklist.md`. This includes verification of no hardcoded secrets, proper input validation, safe cryptographic operations, and privacy-preserving error handling.

Automated scanning runs on every pull request. Gitleaks scans for secrets and credentials. TruffleHog performs deeper secret scanning. ESLint security plugins check for common vulnerability patterns.

Human review is required for all changes touching authentication, authorization, cryptography, or user data. The reviewer agent performs initial security review, followed by human security approval.
