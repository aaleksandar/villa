/**
 * TinyCloud Integration for Villa Identity
 *
 * TinyCloud is passkey-governed cloud storage for user data.
 * This module provides Villa-specific integration for profile sync.
 *
 * @see https://docs.tinycloud.xyz
 */

let TinyCloudWebClass:
  | typeof import("@tinycloudlabs/web-sdk").TinyCloudWeb
  | null = null;

async function getTinyCloudWebClass() {
  if (!TinyCloudWebClass) {
    const module = await import("@tinycloudlabs/web-sdk");
    TinyCloudWebClass = module.TinyCloudWeb;
  }
  return TinyCloudWebClass;
}

type TinyCloudWebInstance = InstanceType<
  typeof import("@tinycloudlabs/web-sdk").TinyCloudWeb
>;

export const VILLA_PREFIX = "villa";

export const TINYCLOUD_KEYS = {
  profile: "villa/profile",
  preferences: "villa/preferences",
  onchain: "villa/onchain",
} as const;

export interface VillaProfile {
  nickname: string;
  avatar: {
    style: string;
    seed: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VillaPreferences {
  theme?: "light" | "dark" | "system";
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
}

export interface VillaOnchainStatus {
  minted: boolean;
  mintedNickname?: string;
  txHash?: string;
  mintedAt?: string;
  chainId?: number;
}

export interface TinyCloudConfig {
  debug?: boolean;
}

export interface TinyCloudSession {
  address: string;
}

let _tcClient: TinyCloudWebInstance | null = null;
let _tcSession: TinyCloudSession | null = null;

export async function getTinyCloudClient(): Promise<TinyCloudWebInstance> {
  if (!_tcClient) {
    const TinyCloudWeb = await getTinyCloudWebClass();
    _tcClient = new TinyCloudWeb();
  }
  return _tcClient;
}

export async function signInToTinyCloud(): Promise<TinyCloudSession> {
  const tc = await getTinyCloudClient();

  try {
    const session = await tc.signIn();

    _tcSession = {
      address: session.address,
    };

    return _tcSession;
  } catch (error) {
    console.error("[TinyCloud] Sign-in failed:", error);
    throw new Error(
      `TinyCloud sign-in failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export function getTinyCloudSession(): TinyCloudSession | null {
  return _tcSession;
}

export function isTinyCloudSignedIn(): boolean {
  return _tcSession !== null;
}

export async function signOutFromTinyCloud(): Promise<void> {
  const tc = await getTinyCloudClient();
  try {
    await tc.signOut();
  } catch {
    // Ignore sign-out errors
  }
  _tcSession = null;
}

export async function saveProfile(profile: VillaProfile): Promise<void> {
  if (!_tcSession) {
    throw new Error("Not signed in to TinyCloud");
  }

  const tc = await getTinyCloudClient();

  try {
    await tc.storage.put(TINYCLOUD_KEYS.profile, {
      ...profile,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[TinyCloud] Failed to save profile:", error);
    throw new Error(
      `Failed to save profile: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function getProfile(): Promise<VillaProfile | null> {
  if (!_tcSession) {
    throw new Error("Not signed in to TinyCloud");
  }

  const tc = await getTinyCloudClient();

  try {
    const result = await tc.storage.get(TINYCLOUD_KEYS.profile);
    if (!result || !result.data) {
      return null;
    }
    return result.data as unknown as VillaProfile;
  } catch (error) {
    if (error instanceof Error && error.message.includes("NOT_FOUND")) {
      return null;
    }
    console.error("[TinyCloud] Failed to get profile:", error);
    throw new Error(
      `Failed to get profile: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function updateProfile(
  updates: Partial<Omit<VillaProfile, "createdAt" | "updatedAt">>,
): Promise<VillaProfile> {
  const existing = await getProfile();

  const updatedProfile: VillaProfile = {
    nickname: updates.nickname ?? existing?.nickname ?? "",
    avatar: updates.avatar ??
      existing?.avatar ?? { style: "lorelei", seed: "" },
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveProfile(updatedProfile);
  return updatedProfile;
}

export async function savePreferences(
  preferences: VillaPreferences,
): Promise<void> {
  if (!_tcSession) {
    throw new Error("Not signed in to TinyCloud");
  }

  const tc = await getTinyCloudClient();

  try {
    await tc.storage.put(TINYCLOUD_KEYS.preferences, preferences);
  } catch (error) {
    console.error("[TinyCloud] Failed to save preferences:", error);
    throw new Error(
      `Failed to save preferences: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function getPreferences(): Promise<VillaPreferences | null> {
  if (!_tcSession) {
    throw new Error("Not signed in to TinyCloud");
  }

  const tc = await getTinyCloudClient();

  try {
    const result = await tc.storage.get(TINYCLOUD_KEYS.preferences);
    if (!result || !result.data) {
      return null;
    }
    return result.data as unknown as VillaPreferences;
  } catch (error) {
    if (error instanceof Error && error.message.includes("NOT_FOUND")) {
      return null;
    }
    console.error("[TinyCloud] Failed to get preferences:", error);
    throw new Error(
      `Failed to get preferences: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function saveOnchainStatus(
  status: VillaOnchainStatus,
): Promise<void> {
  if (!_tcSession) {
    throw new Error("Not signed in to TinyCloud");
  }

  const tc = await getTinyCloudClient();

  try {
    await tc.storage.put(TINYCLOUD_KEYS.onchain, status);
  } catch (error) {
    console.error("[TinyCloud] Failed to save on-chain status:", error);
    throw new Error(
      `Failed to save on-chain status: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function getOnchainStatus(): Promise<VillaOnchainStatus | null> {
  if (!_tcSession) {
    throw new Error("Not signed in to TinyCloud");
  }

  const tc = await getTinyCloudClient();

  try {
    const result = await tc.storage.get(TINYCLOUD_KEYS.onchain);
    if (!result || !result.data) {
      return null;
    }
    return result.data as unknown as VillaOnchainStatus;
  } catch (error) {
    if (error instanceof Error && error.message.includes("NOT_FOUND")) {
      return null;
    }
    console.error("[TinyCloud] Failed to get on-chain status:", error);
    throw new Error(
      `Failed to get on-chain status: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function recordNicknameMint(
  nickname: string,
  txHash: string,
  chainId: number,
): Promise<void> {
  await saveOnchainStatus({
    minted: true,
    mintedNickname: nickname,
    txHash,
    mintedAt: new Date().toISOString(),
    chainId,
  });
}

export async function syncProfile(
  localProfile: VillaProfile,
): Promise<VillaProfile> {
  const remoteProfile = await getProfile();

  if (!remoteProfile) {
    await saveProfile(localProfile);
    return localProfile;
  }

  const localTime = new Date(localProfile.updatedAt).getTime();
  const remoteTime = new Date(remoteProfile.updatedAt).getTime();

  if (localTime > remoteTime) {
    await saveProfile(localProfile);
    return localProfile;
  }

  return remoteProfile;
}

export function _resetTinyCloudClient(): void {
  _tcClient = null;
  _tcSession = null;
}
