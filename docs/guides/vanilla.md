# Vanilla JavaScript Integration Guide

Complete guide to integrating Villa SDK without a framework.

## Installation

```bash
npm install @rockfridrich/villa-sdk viem zod
```

Or via CDN:

```html
<script type="module">
  import { villa } from "https://esm.sh/@rockfridrich/villa-sdk";
</script>
```

## Basic Usage

### One-Line Sign In

```javascript
import { villa } from "@rockfridrich/villa-sdk";

// Sign in with one line
const user = await villa.signIn();
console.log(user.address, user.nickname, user.avatar);
```

### Check Auth State

```javascript
// Check if user is signed in
if (villa.user) {
  console.log("Logged in as", villa.user.nickname);
} else {
  console.log("Not signed in");
}
```

### Sign Out

```javascript
villa.signOut();
```

### Listen to Auth Changes

```javascript
const unsubscribe = villa.onAuthChange((user) => {
  if (user) {
    showDashboard(user);
  } else {
    showLoginButton();
  }
});

// Later: stop listening
unsubscribe();
```

## Full Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Villa Auth Demo</title>
  </head>
  <body>
    <div id="app">
      <button id="login-btn">Sign In with Villa</button>
      <div id="user-info" style="display: none;">
        <p>Welcome, <span id="nickname"></span>!</p>
        <p>Address: <span id="address"></span></p>
        <button id="logout-btn">Sign Out</button>
      </div>
    </div>

    <script type="module">
      import { villa } from "https://esm.sh/@rockfridrich/villa-sdk";

      const loginBtn = document.getElementById("login-btn");
      const logoutBtn = document.getElementById("logout-btn");
      const userInfo = document.getElementById("user-info");

      // Listen to auth changes
      villa.onAuthChange((user) => {
        if (user) {
          loginBtn.style.display = "none";
          userInfo.style.display = "block";
          document.getElementById("nickname").textContent = user.nickname;
          document.getElementById("address").textContent = user.address;
        } else {
          loginBtn.style.display = "block";
          userInfo.style.display = "none";
        }
      });

      // Sign in
      loginBtn.addEventListener("click", async () => {
        try {
          await villa.signIn();
        } catch (error) {
          if (error.message !== "User cancelled authentication") {
            alert("Sign in failed: " + error.message);
          }
        }
      });

      // Sign out
      logoutBtn.addEventListener("click", () => {
        villa.signOut();
      });
    </script>
  </body>
</html>
```

## Advanced: Villa Class

For more control, use the Villa class:

```javascript
import { Villa } from "@rockfridrich/villa-sdk";

const client = new Villa({
  appId: "your-app-id",
  network: "base", // or 'base-sepolia' for testnet
});

// Sign in with options
const result = await client.signIn({
  scopes: ["profile", "wallet"],
  timeout: 5 * 60 * 1000,
  onProgress: (step) => {
    console.log(step.message);
  },
});

if (result.success) {
  console.log("Welcome", result.identity.nickname);
  console.log("Address:", result.identity.address);
} else {
  console.error("Error:", result.error, result.code);
}

// Other methods
client.isAuthenticated(); // boolean
client.getIdentity(); // Identity | null
await client.signOut();

// Utility methods
const address = await client.resolveEns("alice.villa.cash");
const name = await client.reverseEns("0x...");
const avatarUrl = client.getAvatarUrl(address, { style: "avataaars" });
```

## Advanced: VillaBridge

For fine-grained control over the auth flow:

```javascript
import { VillaBridge } from "@rockfridrich/villa-sdk";

const bridge = new VillaBridge({
  appId: "your-app",
  network: "base",
  timeout: 5 * 60 * 1000,
  debug: true, // Enable logging
});

// Event listeners
bridge.on("ready", () => {
  console.log("Auth UI ready");
});

bridge.on("success", (identity) => {
  console.log("Authenticated:", identity.nickname);
  // Save to your session
});

bridge.on("cancel", () => {
  console.log("User cancelled");
});

bridge.on("error", (error, code) => {
  console.error("Error:", error, code);
});

// Open auth flow
await bridge.open(["profile"]);

// Later: close manually
bridge.close();

// Check state
bridge.getState(); // 'idle' | 'opening' | 'ready' | 'authenticating' | 'closing' | 'closed'
bridge.isOpen(); // boolean
```

## TypeScript Support

The SDK is fully typed:

```typescript
import { villa, type VillaUser } from "@rockfridrich/villa-sdk";
import type { Identity, SignInResult } from "@rockfridrich/villa-sdk";

// villa.user is typed as VillaUser | null
const user: VillaUser | null = villa.user;

// Result is a discriminated union
const result: SignInResult = await villa.signIn();
if (result.success) {
  const identity: Identity = result.identity;
}
```

## Error Handling

```javascript
try {
  const user = await villa.signIn();
  console.log("Success:", user.nickname);
} catch (error) {
  if (error.message === "User cancelled authentication") {
    // User closed the auth modal - this is normal
    console.log("User cancelled");
  } else {
    // Actual error
    console.error("Auth failed:", error.message);
  }
}
```

With Villa class for detailed errors:

```javascript
const result = await client.signIn();

if (!result.success) {
  switch (result.code) {
    case "CANCELLED":
      // User closed - no action needed
      break;
    case "TIMEOUT":
      alert("Authentication timed out. Please try again.");
      break;
    case "NETWORK_ERROR":
      alert("Network error. Check your connection.");
      break;
    case "INVALID_CONFIG":
      console.error("SDK configuration error");
      break;
    default:
      alert(`Error: ${result.error}`);
  }
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 90+
- Safari 13+
- iOS 16+ (Face ID/Touch ID)
- Android 9+ (fingerprint/face unlock)

## Troubleshooting

### Passkeys Not Working

Passkeys require HTTPS. For local development:

```bash
# Option 1: Use localhost (works without HTTPS)
open http://localhost:3000

# Option 2: Use ngrok for mobile testing
npx ngrok http 3000
```

### Session Not Persisting

Villa stores sessions in localStorage. Check:

```javascript
// Verify localStorage is available
console.log(localStorage.getItem("villa:session"));

// Sessions expire after 7 days
```

### CORS Issues

Villa SDK uses postMessage for iframe communication, not fetch. There should be no CORS issues. If you see CORS errors, check your own API calls.
