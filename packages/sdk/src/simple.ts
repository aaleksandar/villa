/**
 * Villa SDK - Simplified API
 *
 * Zero-config, one-liner authentication for Villa ID.
 *
 * @example
 * ```typescript
 * import { villa } from '@rockfridrich/villa-sdk'
 *
 * // One-liner sign in
 * const user = await villa.signIn()
 * console.log(user.address, user.nickname)
 *
 * // Check auth state
 * if (villa.user) {
 *   console.log('Logged in as', villa.user.nickname)
 * }
 *
 * // Sign out
 * villa.signOut()
 * ```
 */

import type { Identity, VillaConfig } from "./types";
import { VillaBridge } from "./iframe/bridge";
import {
  saveSession,
  loadSession,
  clearSession,
  isSessionValid,
} from "./session";

export interface VillaUser {
  address: `0x${string}`;
  nickname: string;
  avatar: string;
  raw: Identity;
}

export interface SimpleSignInOptions {
  silent?: boolean;
  timeout?: number;
}

interface VillaInstance {
  user: VillaUser | null;
  signIn: (options?: SimpleSignInOptions) => Promise<VillaUser>;
  signOut: () => void;
  onAuthChange: (callback: (user: VillaUser | null) => void) => () => void;
  config: (options: Partial<VillaConfig>) => void;
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

let _config: VillaConfig = {
  appId: "villa-app",
  network: "base",
};

let _user: VillaUser | null = null;
let _listeners: Set<(user: VillaUser | null) => void> = new Set();
let _initialized = false;

function identityToUser(identity: Identity): VillaUser {
  const avatarUrl = identity.avatar
    ? `https://api.dicebear.com/7.x/${identity.avatar.style}/svg?seed=${identity.avatar.seed}`
    : `https://api.dicebear.com/7.x/lorelei/svg?seed=${identity.address}`;

  return {
    address: identity.address,
    nickname: identity.nickname || identity.address.slice(0, 8),
    avatar: avatarUrl,
    raw: identity,
  };
}

function notifyListeners() {
  _listeners.forEach((cb) => {
    try {
      cb(_user);
    } catch {}
  });
}

function init() {
  if (_initialized) return;
  _initialized = true;

  const session = loadSession();
  if (session && isSessionValid(session)) {
    _user = identityToUser(session.identity);
  }
}

function configure(options: Partial<VillaConfig>) {
  _config = { ..._config, ...options };
}

async function signIn(options?: SimpleSignInOptions): Promise<VillaUser> {
  init();

  if (_user && options?.silent) {
    return _user;
  }

  return new Promise((resolve, reject) => {
    const bridge = new VillaBridge({
      appId: _config.appId,
      network: _config.network,
      timeout: options?.timeout || 5 * 60 * 1000,
    });

    bridge.on("success", (identity) => {
      const user = identityToUser(identity);
      _user = user;

      saveSession({
        identity,
        expiresAt: Date.now() + SESSION_DURATION_MS,
        isValid: true,
      });

      notifyListeners();
      resolve(user);
    });

    bridge.on("cancel", () => {
      reject(new Error("User cancelled authentication"));
    });

    bridge.on("error", (error) => {
      reject(new Error(error));
    });

    bridge.open(["profile"]).catch(reject);
  });
}

function signOut() {
  _user = null;
  clearSession();
  notifyListeners();
}

function onAuthChange(callback: (user: VillaUser | null) => void): () => void {
  init();
  _listeners.add(callback);
  callback(_user);
  return () => _listeners.delete(callback);
}

function getUser(): VillaUser | null {
  init();
  return _user;
}

export const villa: VillaInstance = {
  get user() {
    return getUser();
  },
  signIn,
  signOut,
  onAuthChange,
  config: configure,
};

export async function signInWithVilla(
  options?: SimpleSignInOptions,
): Promise<VillaUser> {
  return villa.signIn(options);
}

export function getVillaUser(): VillaUser | null {
  return villa.user;
}

export function signOutVilla(): void {
  villa.signOut();
}
