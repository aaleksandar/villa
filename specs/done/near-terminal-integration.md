# Near Terminal Integration Spec

**Status:** Active
**Author:** Claude + Human
**Date:** 2026-01-05
**Updated:** 2026-01-05 - SDK published to npm

## Why

Near Terminal needs to ship identity features fast. Villa provides passkey auth, nickname, and avatar — but they need:
1. Quick SDK integration path
2. User ability to edit profile post-onboarding
3. Future: custom avatar uploads to TinyCloud

## SDK Packages (Published)

```bash
# Install from npm
npm install @rockfridrich/villa-sdk @rockfridrich/villa-sdk-react viem zod
```

## Current SDK Surface

```tsx
// Core SDK - types, helpers, contracts
import {
  Villa,               // Main SDK class
  getAvatarUrl,        // Generate avatar URL
  getContracts,        // Get contract addresses by chainId
  resolveEns,          // Resolve nickname to address
  reverseEns,          // Reverse lookup address to nickname
} from '@rockfridrich/villa-sdk'

// React SDK - components and hooks
import {
  VillaProvider,       // Context provider
  VillaAuth,           // Full auth orchestrator
  Avatar,              // Display user avatar
  AvatarPreview,       // Preview avatar from config
  useIdentity,         // Get current identity
  useAuth,             // Auth state and methods
  useVillaConfig,      // SDK configuration
} from '@rockfridrich/villa-sdk-react'
```

### VillaAuth Response
```tsx
type VillaAuthResponse = {
  success: true
  identity: {
    address: `0x${string}`
    nickname: string
    avatar: AvatarConfig  // { style, selection, variant }
  }
} | {
  success: false
  error: string
  code: 'CANCELLED' | 'AUTH_FAILED' | 'NETWORK_ERROR' | 'TIMEOUT'
}
```

---

## Phase 1: Quick Integration (Now) ✅ READY

### 1.1 Embed VillaAuth

```tsx
// Near Terminal integration
import { VillaAuth } from '@rockfridrich/villa-sdk-react'
import { getAvatarUrl } from '@rockfridrich/villa-sdk'

function LoginPage() {
  const handleComplete = (result) => {
    if (result.success) {
      // Store identity in Near Terminal's system
      await nearTerminal.setUser({
        address: result.identity.address,
        nickname: result.identity.nickname,
        avatarUrl: getAvatarUrl(result.identity.address, result.identity.avatar),
      })
      router.push('/dashboard')
    }
  }

  return <VillaAuth onComplete={handleComplete} appName="Near Terminal" />
}
```

### 1.2 Avatar Rendering

```tsx
import { Avatar, AvatarPreview } from '@rockfridrich/villa-sdk-react'

// From identity (logged in user)
<Avatar identity={user} size={48} />

// From config (preview)
<AvatarPreview config={avatarConfig} address={address} size={48} />
```

### 1.3 Fetch Existing User

```tsx
import { reverseEns } from '@rockfridrich/villa-sdk'

// Check if returning user
const nickname = await reverseEns(address)
if (nickname) {
  // User already onboarded, skip to dashboard
}
```

---

## Phase 2: Profile Settings Component

### Why
Users need to edit their profile after onboarding. Currently:
- Display name editable on home page (inline)
- Avatar only selectable during onboarding
- No unified settings UI

### 2.1 ProfileSettings Component

New component: `apps/web/src/components/sdk/ProfileSettings.tsx`

```tsx
interface ProfileSettingsProps {
  identity: Identity
  onUpdate: (updates: Partial<Identity>) => Promise<void>
  onClose?: () => void
  allowAvatarUpload?: boolean  // Phase 3 feature flag
}

// States
type SettingsView = 'overview' | 'edit-avatar' | 'edit-nickname' | 'upload-avatar'
```

### 2.2 UI Breakdown

```
┌─────────────────────────────────────┐
│  Profile Settings                 ✕ │
├─────────────────────────────────────┤
│                                     │
│         ┌──────────┐                │
│         │  Avatar  │  [Change]      │
│         └──────────┘                │
│                                     │
│  Nickname                           │
│  ┌─────────────────────────────┐    │
│  │ alice.villa                 │    │
│  └─────────────────────────────┘    │
│  ⓘ Nicknames cannot be changed      │
│                                     │
│  Display Name                       │
│  ┌─────────────────────────────┐    │
│  │ Alice                    ✎ │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Connected Apps         [Manage →]  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [ Delete Account ]  (destructive)  │
│                                     │
└─────────────────────────────────────┘
```

### 2.3 Avatar Change Flow

Reuse existing `AvatarSelection` component:

```tsx
// In ProfileSettings
{view === 'edit-avatar' && (
  <AvatarSelection
    walletAddress={identity.address}
    onSelect={(config) => {
      onUpdate({ avatar: config })
      setView('overview')
    }}
    timerDuration={60}  // More relaxed for editing
  />
)}
```

### 2.4 Export from SDK

```tsx
// Update apps/web/src/components/sdk/index.ts
export { ProfileSettings } from './ProfileSettings'
export type { ProfileSettingsProps } from './ProfileSettings'
```

---

## Phase 3: Avatar Upload with TinyCloud

### Why
Some users want custom avatars (photos, brand images). Generated avatars are anonymous but not personal.

### 3.1 TinyCloud Integration

Install SDK:
```bash
pnpm add @tinycloudlabs/web-sdk
```

Initialize with wallet:
```tsx
import { TinyCloud } from '@tinycloudlabs/web-sdk'

const storage = new TinyCloud()
await storage.connect()  // SIWE authentication
```

### 3.2 Avatar Upload Flow

```
User taps "Upload Photo"
      ↓
File picker opens (accept: image/*)
      ↓
Image loads → Crop UI (square, 1:1 ratio)
      ↓
Client-side resize to 512x512 max
      ↓
Convert to WebP (smaller size)
      ↓
Upload to TinyCloud: storage.put(`avatar/${address}`, imageBlob)
      ↓
Store reference in profile: { type: 'custom', url: tinyCloudUrl }
      ↓
Success animation
```

### 3.3 Crop Component

Use `react-image-crop` or similar:

```tsx
interface AvatarCropProps {
  image: File
  onCrop: (croppedBlob: Blob) => void
  onCancel: () => void
}

function AvatarCrop({ image, onCrop, onCancel }: AvatarCropProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    aspect: 1,  // Square
  })

  return (
    <div className="avatar-crop">
      <ReactCrop crop={crop} onChange={setCrop} aspect={1}>
        <img src={URL.createObjectURL(image)} />
      </ReactCrop>
      <div className="actions">
        <Button onClick={onCancel} variant="secondary">Cancel</Button>
        <Button onClick={() => cropAndExport(crop, image, onCrop)}>
          Save
        </Button>
      </div>
    </div>
  )
}
```

### 3.4 Storage Schema

```tsx
// TinyCloud key structure
const AVATAR_KEY = `villa/avatars/${address}`

// Avatar union type (backwards compatible)
type Avatar =
  | AvatarConfig  // Generated: { style, selection, variant }
  | CustomAvatar  // Uploaded: { type: 'custom', url, hash }

interface CustomAvatar {
  type: 'custom'
  url: string       // TinyCloud URL
  hash: string      // SHA-256 for integrity
  uploadedAt: number
}
```

### 3.5 Validation & Safety

```tsx
const AVATAR_LIMITS = {
  maxSizeBytes: 5 * 1024 * 1024,  // 5MB raw
  maxDimension: 2048,             // Max source dimension
  outputSize: 512,                // Saved at 512x512
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
}

async function validateAvatar(file: File): Promise<{ valid: boolean; error?: string }> {
  if (file.size > AVATAR_LIMITS.maxSizeBytes) {
    return { valid: false, error: 'Image too large (max 5MB)' }
  }
  if (!AVATAR_LIMITS.allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported image format' }
  }
  // Additional: dimension check via createImageBitmap
  return { valid: true }
}
```

### 3.6 Fallback Behavior

```tsx
// Always keep generated avatar as fallback
async function getAvatarUrl(identity: Identity): Promise<string> {
  if (identity.avatar.type === 'custom') {
    try {
      // Try loading custom avatar
      const response = await fetch(identity.avatar.url)
      if (response.ok) return identity.avatar.url
    } catch {
      // Fall through to generated
    }
  }
  // Generate deterministic avatar
  return generateAvatarDataUrl(identity.address, identity.avatar)
}
```

---

## API Endpoints (Phase 2+)

### Profile Update
```
PATCH /api/profile
Authorization: Bearer <session>
Content-Type: application/json

{
  "displayName": "Alice",
  "avatar": { "style": "avataaars", "selection": "female", "variant": 42 }
}
```

### Avatar Upload (Phase 3)
```
POST /api/profile/avatar
Authorization: Bearer <session>
Content-Type: multipart/form-data

file: <image>

Response:
{
  "url": "tinycloud://...",
  "hash": "sha256:..."
}
```

---

## Work Breakdown

### Phase 1 (Now - Quick Win)
| Task | Owner | Est. Lines |
|------|-------|------------|
| Document SDK embedding | @spec | 50 |
| Add appName prop to VillaAuth | @build | 20 |
| Create integration example | @build | 100 |

### Phase 2 (Settings UI)
| Task | Owner | Est. Lines |
|------|-------|------------|
| ProfileSettings component | @build | 300 |
| Avatar re-selection in settings | @build | 50 |
| Display name edit (extract from home) | @build | 100 |
| Export from SDK index | @build | 10 |
| E2E tests for settings | @test | 150 |

### Phase 3 (Avatar Upload)
| Task | Owner | Est. Lines |
|------|-------|------------|
| TinyCloud SDK integration | @build | 100 |
| AvatarCrop component | @build | 200 |
| Upload validation | @build | 80 |
| API route for upload | @build | 150 |
| Storage schema migration | @build | 50 |
| E2E tests for upload | @test | 200 |

---

## Decision Points

1. **Nickname editing?**
   - Current: Read-only (spec says "not in v1")
   - Recommendation: Keep read-only for now, add in v1.1

2. **Avatar upload priority?**
   - If Near Terminal needs it NOW: Prioritize Phase 3
   - If generated avatars suffice: Focus on Phase 2 first

3. **TinyCloud vs Cloudinary?**
   - TinyCloud: Web3-native, user owns data, decentralized
   - Cloudinary: Battle-tested, better image processing
   - Recommendation: TinyCloud for alignment with Web3 ethos

---

## Success Metrics

- Near Terminal integration < 1 day of dev work
- Settings page load time < 200ms
- Avatar upload success rate > 99%
- Zero data loss on fallback to generated avatar

---

## References

- [TinyCloud SDK](https://docs.tinycloud.xyz/)
- [DiceBear Avatars](https://www.dicebear.com/)
- [react-image-crop](https://www.npmjs.com/package/react-image-crop)
- [Villa SDK Components](../apps/web/src/components/sdk/)
