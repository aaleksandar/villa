"use client";

import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
  Suspense,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";
import { createAccount, signIn, isPortoSupported } from "@/lib/porto";
import { generateNickname } from "@/lib/nickname";

const HUB_API_URL =
  process.env.NEXT_PUBLIC_HUB_API_URL || "https://beta.villa.cash";

async function persistProfile(
  address: string,
  nickname: string,
  maxRetries = 3,
): Promise<{ nickname: string; persisted: boolean }> {
  let currentNickname = nickname;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${HUB_API_URL}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          nickname: currentNickname,
          avatar: { style: "lorelei", selection: address, variant: 0 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { nickname: data.nickname || currentNickname, persisted: true };
      }

      const isNicknameCollision = response.status === 409;
      if (isNicknameCollision) {
        const suffix = Math.floor(Math.random() * 1000);
        currentNickname = `${nickname}${suffix}`;
        continue;
      }

      const isDatabaseUnavailable = response.status === 503;
      if (isDatabaseUnavailable) {
        return { nickname, persisted: false };
      }

      return { nickname, persisted: false };
    } catch {
      return { nickname, persisted: false };
    }
  }

  return { nickname: currentNickname, persisted: false };
}

async function fetchProfile(
  address: string,
): Promise<{ nickname: string } | null> {
  try {
    const response = await fetch(
      `${HUB_API_URL}/api/profile/${address.toLowerCase()}`,
    );
    if (response.ok) {
      const data = await response.json();
      return { nickname: data.nickname || "" };
    }
    return null;
  } catch {
    return null;
  }
}

const VILLA_ORIGINS = [
  "https://villa.cash",
  "https://www.villa.cash",
  "https://beta.villa.cash",
  "https://dev-1.villa.cash",
  "https://dev-2.villa.cash",
  "https://developers.villa.cash",
  "https://key.villa.cash",
  "https://beta-key.villa.cash",
] as const;

const DEV_ORIGINS = [
  "https://local.villa.cash",
  "https://localhost",
  "https://localhost:443",
  "https://localhost:3000",
  "https://localhost:3001",
  "http://localhost:3000",
  "http://localhost:3001",
] as const;

const REGISTERED_APP_ORIGINS = [
  "https://lovable.dev",
  "https://www.lovable.dev",
] as const;

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isInPopup(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const explicitMode = params.get("mode");
  return (
    explicitMode === "popup" ||
    (window.opener != null && window.opener !== window)
  );
}

function isAllowedOrigin(origin: string): boolean {
  return (
    VILLA_ORIGINS.includes(origin as (typeof VILLA_ORIGINS)[number]) ||
    DEV_ORIGINS.includes(origin as (typeof DEV_ORIGINS)[number]) ||
    REGISTERED_APP_ORIGINS.includes(
      origin as (typeof REGISTERED_APP_ORIGINS)[number],
    )
  );
}

function getValidatedParentOrigin(queryOrigin: string | null): string | null {
  if (typeof document !== "undefined" && document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      const referrerOrigin = referrerUrl.origin;
      if (isAllowedOrigin(referrerOrigin)) {
        return referrerOrigin;
      }
    } catch {
      // Invalid referrer URL
    }
  }

  if (queryOrigin && isAllowedOrigin(queryOrigin)) {
    return queryOrigin;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      if (typeof document !== "undefined" && document.referrer) {
        try {
          const referrerUrl = new URL(document.referrer);
          if (
            DEV_ORIGINS.includes(
              referrerUrl.origin as (typeof DEV_ORIGINS)[number],
            )
          ) {
            return referrerUrl.origin;
          }
        } catch {
          // Invalid referrer
        }
      }
      return "https://localhost";
    }
  }

  return null;
}

function AuthPageContent() {
  const searchParams = useSearchParams();
  const hasNotifiedReady = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryOrigin = searchParams.get("origin");
  const targetOrigin = useMemo(
    () => getValidatedParentOrigin(queryOrigin),
    [queryOrigin],
  );
  const inPopup = useMemo(() => isInPopup(), []);
  const inIframe = useMemo(() => isInIframe(), []);

  const postToParent = useCallback(
    (message: Record<string, unknown>) => {
      if (!inPopup && !inIframe) return;
      if (!targetOrigin) {
        console.warn(
          "[Villa Auth] No trusted origin found, message not sent:",
          message,
        );
        return;
      }
      const target = inPopup ? window.opener : window.parent;
      if (target) {
        target.postMessage(message, targetOrigin);
      }
    },
    [targetOrigin, inPopup, inIframe],
  );

  useEffect(() => {
    if (!hasNotifiedReady.current) {
      hasNotifiedReady.current = true;
      postToParent({ type: "VILLA_READY" });
    }
  }, [postToParent]);

  const handleSuccess = useCallback(
    async (address: string, isNewAccount: boolean = false) => {
      let nickname = "";

      if (isNewAccount) {
        const generatedNickname = generateNickname(address);
        const { nickname: persistedNickname } = await persistProfile(
          address,
          generatedNickname,
        );
        nickname = persistedNickname;
      } else {
        const profile = await fetchProfile(address);
        nickname = profile?.nickname || "";
      }

      const identity = {
        address,
        nickname,
        avatar: {
          style: "lorelei",
          seed: address,
        },
      };
      postToParent({ type: "AUTH_SUCCESS", identity });
      postToParent({ type: "VILLA_AUTH_SUCCESS", payload: { identity } });
      if (inPopup) {
        setTimeout(() => window.close(), 500);
      }
    },
    [postToParent, inPopup],
  );

  const handleCancel = useCallback(() => {
    postToParent({ type: "AUTH_CLOSE" });
    postToParent({ type: "VILLA_AUTH_CANCEL" });
    if (inPopup) {
      setTimeout(() => window.close(), 500);
    }
  }, [postToParent, inPopup]);

  const handleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    const result = await signIn();
    setIsLoading(false);
    if (result.success) {
      handleSuccess(result.address, false);
    } else {
      setError(result.error?.message || "Sign in failed");
    }
  };

  const handleCreateAccount = async () => {
    setError(null);
    setIsLoading(true);
    const result = await createAccount();
    setIsLoading(false);
    if (result.success) {
      handleSuccess(result.address, true);
    } else {
      setError(result.error?.message || "Account creation failed");
    }
  };

  if (!isPortoSupported()) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-serif text-ink mb-2">
            Passkeys Not Supported
          </h1>
          <p className="text-sm text-ink-muted">
            Your browser doesn&apos;t support passkeys. Please use a modern
            browser like Chrome, Safari, or Firefox.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-cream-50 flex flex-col justify-between p-6"
    >
      <div className="pt-12 text-center">
        <h1 className="text-2xl font-serif text-ink">Villa</h1>
      </div>

      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif text-ink">Sign in with passkey</h2>
          <p className="text-sm text-ink-muted">
            Use your fingerprint, face, or security key
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full min-h-14 py-4 px-6 bg-accent-yellow hover:bg-villa-600
                       text-accent-brown font-medium rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2 focus:ring-offset-cream-50
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          <button
            onClick={handleCreateAccount}
            disabled={isLoading}
            className="w-full min-h-14 py-4 px-6 bg-cream-100 border border-neutral-200
                       text-ink font-medium rounded-xl hover:bg-cream-200
                       focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2 focus:ring-offset-cream-50
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all active:scale-[0.98]"
          >
            Create Villa ID
          </button>

          <button
            onClick={handleCancel}
            className="w-full min-h-11 py-3 text-sm text-ink-muted hover:text-ink
                       focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:ring-offset-2 focus:ring-offset-cream-50
                       rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="pb-8 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-accent-green" />
        <span className="text-xs text-ink-muted">
          Secured by passkeys on Base
        </span>
      </div>
    </motion.div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-ink-muted">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
