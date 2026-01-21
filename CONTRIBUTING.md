# Contributing to Villa

Welcome to the Villa project. We are building a privacy-first identity and community companion app that empowers users to own their digital presence without corporate intermediaries. Villa is designed for the AI-native era, providing drop-in passkey authentication, persistent identities, and cross-device synchronization.

As an open-source project, we value contributions from developers of all backgrounds. Whether you are fixing a bug, adding a new feature, improving documentation, or refining the user experience, your help is essential to our mission.

This guide is intended for Abu and other contributors to understand how to get started, our development workflow, and the standards we maintain to ensure quality and security.

## Getting Started

To contribute to Villa, you will need to set up your local development environment. We use a monorepo structure managed with pnpm workspaces and Turbo.

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js**: Version 18 or higher.
- **pnpm**: Version 8 or higher.
- **Git**: For version control.
- **Docker**: Optional, for running local infrastructure like PostgreSQL.

### Installation

1. Clone the repository from GitHub:

   ```bash
   git clone https://github.com/rockfridrich/villa.git
   cd villa
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Environment Setup

Villa requires several environment variables for authentication and database connectivity.

1. Copy the example environment files:

   ```bash
   cp .env.example .env
   ```

2. Configure your `.env` file with the necessary credentials. For local development, many values can be left as defaults.

3. If you are working on features that require HTTPS (like WebAuthn), use `mkcert` to set up local certificates.

## Project Structure

Villa is organized as a monorepo to facilitate code sharing and consistent tooling.

```
villa/
├── apps/
│   ├── hub/          # Main web app (villa.cash)
│   ├── key/          # Auth iframe (key.villa.cash)
│   ├── developers/   # Docs site (developers.villa.cash)
├── packages/
│   ├── sdk/          # @rockfridrich/villa-sdk
│   ├── sdk-react/    # @rockfridrich/villa-sdk-react
│   ├── ui/           # @villa/ui shared components
│   ├── config/       # Shared configs (Tailwind, TypeScript)
│   ├── api/          # Shared API utilities
├── contracts/        # Solidity smart contracts
```

## Development Workflow

We use Turbo to manage our build pipeline and task execution, allowing for fast, incremental builds.

### Common Commands

- **Start all applications**: `pnpm dev`
- **Build all packages and apps**: `pnpm build`
- **Type checking**: `pnpm typecheck`
- **Linting**: `pnpm lint`
- **Running tests**: `pnpm test`
- **E2E testing**: `pnpm test:e2e`

## Environments

Villa operates across multiple environments to ensure stability.

| Environment | Apps Domain      | SDK Auth Domain     | Network      | Use Case                                              |
| ----------- | ---------------- | ------------------- | ------------ | ----------------------------------------------------- |
| Production  | villa.cash       | key.villa.cash      | Base         | Final stable releases.                                |
| Staging     | beta.villa.cash  | beta-key.villa.cash | Base Sepolia | Testing with real blockchain interactions on testnet. |
| PR Preview  | dev-1.villa.cash | beta-key.villa.cash | Base Sepolia | Automated deployments for every Pull Request.         |

## Making Changes

### 1. Branching Strategy

Create a new branch using the pattern `type/short-description`:

- `feature/add-avatar-upload`
- `fix/passkey-error-handling`
- `docs/update-sdk-reference`

### 2. Implementation

Make changes following our code style and design system. Add tests for any new functionality or bug fixes.

### 3. Verification

Before committing, ensure your changes don't break existing functionality:

```bash
pnpm typecheck && pnpm lint
```

### 4. Conventional Commits

We use the Conventional Commits specification: `<type>(<scope>): <description>`

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
Example: `feat(sdk): add support for custom session TTL`

### 5. Pushing and PRs

Push your branch and create a Pull Request against `main`. Explain the reasoning behind your changes and include screenshots for UI modifications.

## Design System

Villa uses a warm, trustworthy, and modern aesthetic.

### Tailwind Configuration

All apps must use the shared Tailwind preset at `@villa/config/tailwind.preset`.

### UI Components

Check `packages/ui` first for existing components. Shared components should be added there.

### Color Tokens

Use Tailwind classes from our preset:

- **Cream**: Primary backgrounds (`bg-cream-100`, `bg-cream-200`)
- **Ink**: Primary text and deep backgrounds (`text-ink`, `bg-ink`)
- **Accent**: Use sparingly for highlights:
  - `accent-yellow`: Primary actions
  - `accent-green`: Success states
  - `accent-brown`: Deep contrast

### Typography

- **Serif**: `DM Serif Display` for headings.
- **Sans**: `Inter` for body text and interface elements.

## Code Style

- **TypeScript**: Strict mode is required. No `any` types. Use Zod for validation.
- **React**: Use functional components and hooks. Ensure interactive elements have proper focus states.
- **Security**: Never log sensitive info. Sanitize all inputs. Follow least privilege principles.

## Contributing to Specifications

Villa is spec-driven. Architectural decisions should precede implementation.

- **Location**: All specifications are in the `specs/` directory.
- **Process**: Draft specs in `specs/active/`, move to `specs/done/` after implementation.
- **Format**: Markdown with clear headings and Mermaid diagrams.
- **Review**: Architectural changes may require an ADR in `specs/decisions/`.

## PR Review Process

### CI Requirements

All PRs must pass the automated CI pipeline: build, typecheck, lint, and all tests.

### Preview Deployments

PRs are deployed to a preview environment (e.g., `dev-1.villa.cash`) for verification.

### Approval

At least one approval from a maintainer is required. Reviewers check for correctness, performance, adherence to design system, and test coverage.

## Getting Help

- Join our Telegram community.
- Open a discussion on GitHub.
- Reach out to @rockfridrich or other maintainers.

Thank you for contributing to Villa!
