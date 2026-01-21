# Villa ID Integration Guide

Villa ID is a privacy-first identity system designed for the next generation of applications. By leveraging passkeys (WebAuthn) and the Base network, Villa ID provides a seamless, "walletless" experience for users while giving developers a robust Ethereum-based identity layer.

Whether you are building a "Product Hunt for popup villages" or a community-driven social app, Villa ID removes the friction of traditional crypto onboarding while maintaining the security and decentralization of the blockchain.

## What You Get

Villa ID provides a complete out-of-the-box identity solution:

- **Passkey Authentication**: No more passwords or seed phrases. Users authenticate using the secure biometrics already built into their devices (Face ID, Touch ID, or Android Fingerprint).
- **Global Nicknames**: Every user picks a unique nickname (e.g., alice.villa.eth). This nickname is persistent across all apps in the Villa ecosystem.
- **Deterministic Avatars**: Users get a consistent visual identity. The SDK includes components to render these avatars effortlessly.
- **Ethereum Identity**: Behind the scenes, every Villa ID is backed by a deterministic Ethereum address on the Base network. This allows users to own assets, sign messages, and participate in on-chain governance.

## Installation

Integrating Villa ID into your React application is straightforward. Install the core SDK, the React wrapper, and the necessary peer dependencies:

```bash
npm install @rockfridrich/villa-sdk @rockfridrich/villa-sdk-react viem zod
```

_Note: viem and zod are required peer dependencies used for blockchain interactions and data validation._

## Quick Start

### 1. Configure the Provider

The VillaProvider is the root component that manages the authentication state and provides configuration to the rest of your app. Wrap your main application component (e.g., in layout.tsx or App.tsx) with the provider.

```tsx
import { VillaProvider } from "@rockfridrich/villa-sdk-react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <VillaProvider
          config={{
            appId: "your-unique-app-id",
            network: "base", // Use 'base-sepolia' for development
          }}
        >
          {children}
        </VillaProvider>
      </body>
    </html>
  );
}
```

### 2. Add the Auth Button

The SDK provides a pre-built VillaAuth component that handles the entire login flow. You can use the useIdentity hook to check if a user is already logged in.

```tsx
import {
  VillaAuth,
  useIdentity,
  useAuth,
  Avatar,
} from "@rockfridrich/villa-sdk-react";

export function Header() {
  const identity = useIdentity();
  const { signOut } = useAuth();

  // If the user is not logged in, show the VillaAuth button
  if (!identity) {
    return (
      <nav>
        <span>Welcome to our Village!</span>
        <VillaAuth
          onComplete={(result) => {
            if (result.success) {
              console.log("User joined:", result.identity.nickname);
            }
          }}
        />
      </nav>
    );
  }

  // If logged in, show their profile info
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <Avatar identity={identity} size={40} />
      <div>
        <strong>@{identity.nickname}</strong>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
          {identity.address}
        </p>
      </div>
      <button onClick={signOut}>Sign Out</button>
    </nav>
  );
}
```

## What Your Users See

Villa ID is designed to be as non-intrusive as possible while providing high security. When a user interacts with the VillaAuth component or calls the signIn() method:

1. **Fullscreen Auth Overlay**: A secure iframe opens over your application, dimming the background. This UI is hosted on villa.cash, which provides a trusted environment for the user.
2. **Biometric Verification**: The browser triggers a native system prompt. The user simply glances at their phone or touches their fingerprint sensor to authenticate.
3. **Identity Setup (New Users)**: If it's the user's first time, they will be prompted to choose a nickname and a preferred avatar style. This step is skipped for returning users.
4. **Instant Completion**: Once the passkey is verified, the iframe vanishes, and your application immediately has access to the user's identity, including their nickname and Ethereum address.

This experience feels like a native "Sign in with Apple" or "Sign in with Google" flow, but it is entirely decentralized and self-sovereign.

## The Identity Object

The identity object returned by the SDK contains everything you need to represent the user:

```typescript
interface Identity {
  address: `0x${string}`; // The user's Ethereum address
  nickname: string; // Their global Villa nickname (e.g., "alice")
  avatar: {
    style: string; // The DiceBear style name
    seed: string; // The seed used for generation
  };
}
```

## Environments & URLs

Villa ID maintains two separate environments to help you develop and test your application safely.

| Environment | Network Name | Auth Domain          | Base Chain           |
| ----------- | ------------ | -------------------- | -------------------- |
| Production  | base         | villa.cash/auth      | Base Mainnet         |
| Staging     | base-sepolia | beta.villa.cash/auth | Base Sepolia Testnet |

### Best Practices

- **Development**: Use the base-sepolia network during development to avoid using real identities and to test edge cases.
- **Production**: Switch to the base network when you are ready to launch to real users.
- **HTTPS**: Because Villa ID uses WebAuthn (passkeys), your application must be served over HTTPS in production. For local development, localhost is generally treated as a secure context by browsers.
