# Next.js Integration Guide

Complete guide to integrating Villa SDK with Next.js App Router.

## Installation

```bash
npm install @rockfridrich/villa-sdk @rockfridrich/villa-sdk-react viem zod
```

## Setup

### 1. Create Providers Component

```tsx
// app/providers.tsx
"use client";

import { VillaProvider } from "@rockfridrich/villa-sdk-react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <VillaProvider
      config={{
        appId: "your-app-id",
        network: "base", // or 'base-sepolia' for testnet
      }}
    >
      {children}
    </VillaProvider>
  );
}
```

### 2. Update Root Layout

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 3. Create Auth Page

```tsx
// app/login/page.tsx
"use client";

import { VillaAuth } from "@rockfridrich/villa-sdk-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <VillaAuth
        onComplete={(result) => {
          if (result.success) {
            router.push("/dashboard");
          }
        }}
      />
    </div>
  );
}
```

### 4. Protected Pages

```tsx
// app/dashboard/page.tsx
"use client";

import { useIdentity, useAuth } from "@rockfridrich/villa-sdk-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const identity = useIdentity();
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!identity) {
      router.push("/login");
    }
  }, [identity, router]);

  if (!identity) return null;

  return (
    <div>
      <h1>Welcome, @{identity.nickname}!</h1>
      <p>Address: {identity.address}</p>
      <button
        onClick={() => {
          signOut();
          router.push("/");
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
```

## Simple API (No Provider)

For simpler apps, use the hook-based API without a provider:

```tsx
// app/page.tsx
"use client";

import { useVilla, VillaButton } from "@rockfridrich/villa-sdk-react";

export default function Home() {
  const { user, signOut } = useVilla();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <VillaButton onSignIn={(u) => console.log("Welcome", u.nickname)} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <p>@{user.nickname}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## Middleware for Protected Routes

```ts
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("villa-session");

  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/:path*",
};
```

## Server Components

Villa SDK is client-side only. For server components, check auth state:

```tsx
// app/api/user/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = cookies();
  const session = cookieStore.get("villa-session");

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate session
  try {
    const data = JSON.parse(session.value);
    return NextResponse.json({ user: data.identity });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_VILLA_APP_ID=your-app-id
NEXT_PUBLIC_VILLA_NETWORK=base
```

```tsx
// app/providers.tsx
<VillaProvider config={{
  appId: process.env.NEXT_PUBLIC_VILLA_APP_ID!,
  network: process.env.NEXT_PUBLIC_VILLA_NETWORK as 'base' | 'base-sepolia'
}}>
```

## TypeScript Types

```ts
// types/villa.ts
import type { Identity, SignInResult } from "@rockfridrich/villa-sdk";

export type { Identity, SignInResult };

// Custom types for your app
export interface User extends Identity {
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: "light" | "dark";
  notifications: boolean;
}
```

## Troubleshooting

### Hydration Errors

Villa components must be client-side. Add `'use client'` directive:

```tsx
"use client";

import { useVilla } from "@rockfridrich/villa-sdk-react";
```

### HTTPS for Passkeys

Passkeys require HTTPS. For local development:

```bash
# Using mkcert
mkcert localhost
npm run dev -- --experimental-https

# Or use ngrok
npx ngrok http 3000
```

### Session Persistence

Sessions are stored in localStorage. For server-side auth, sync to cookies:

```tsx
// In your auth callback
const result = await villa.signIn();
if (result.success) {
  // Sync to cookie for server access
  document.cookie = `villa-session=${JSON.stringify(result.identity)};path=/;max-age=604800`;
}
```

## Example Repository

See the complete example: [examples/nextjs-app](https://github.com/rockfridrich/villa/tree/main/examples/nextjs-app)
