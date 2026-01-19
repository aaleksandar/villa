"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { SignInWelcome } from "./SignInWelcome";
import { AuthProfile } from "./AuthProfile";
import { createAccount, signIn, resetPorto } from "@/lib/porto";
import { useIdentityStore } from "@/lib/store";
import type { AvatarConfig } from "@/types";

export interface VillaAuthResult {
  success: true;
  identity: {
    address: `0x${string}`;
    nickname: string;
    avatar: AvatarConfig;
  };
}

export interface VillaAuthError {
  success: false;
  error: string;
  code: "CANCELLED" | "AUTH_FAILED" | "NETWORK_ERROR" | "TIMEOUT";
}

export type VillaAuthResponse = VillaAuthResult | VillaAuthError;

interface VillaAuthProps {
  onComplete: (result: VillaAuthResponse) => void;
  initialStep?: AuthStep;
  existingAddress?: `0x${string}`;
  appName?: string;
}

type AuthStep = "welcome" | "connecting" | "profile" | "success" | "error";

interface AuthState {
  step: AuthStep;
  address: `0x${string}` | null;
  nickname: string | null;
  avatar: AvatarConfig | null;
  error: string | null;
  isReturningUser: boolean;
}

export function VillaAuth({
  onComplete,
  initialStep = "welcome",
  existingAddress,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appName = "this app",
}: VillaAuthProps) {
  const [state, setState] = useState<AuthState>({
    step: initialStep,
    address: existingAddress || null,
    nickname: null,
    avatar: null,
    error: null,
    isReturningUser: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const { setIdentity, identity: storedIdentity } = useIdentityStore();

  const prefersReducedMotion = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  ).current;

  useEffect(() => {
    if (
      storedIdentity?.address &&
      storedIdentity?.displayName &&
      storedIdentity?.avatar
    ) {
      const avatar: AvatarConfig | null =
        typeof storedIdentity.avatar === "object"
          ? storedIdentity.avatar
          : null;

      setState((prev) => ({
        ...prev,
        isReturningUser: true,
        address: storedIdentity.address as `0x${string}`,
        nickname: storedIdentity.displayName,
        avatar,
      }));
    }
  }, [storedIdentity]);

  const handleSignIn = useCallback(async () => {
    setState((prev) => ({ ...prev, step: "connecting", error: null }));

    try {
      if (!containerRef.current) throw new Error("Container not ready");

      const result = await signIn({ container: containerRef.current });

      if (!result.success) {
        throw new Error(
          result.error.message || "No address returned from passkey",
        );
      }

      const address = result.address as `0x${string}`;

      const storedAvatar =
        storedIdentity?.avatar && typeof storedIdentity.avatar === "object"
          ? storedIdentity.avatar
          : null;

      if (
        storedIdentity?.address === address &&
        storedIdentity.displayName &&
        storedAvatar
      ) {
        setState((prev) => ({
          ...prev,
          step: "success",
          address,
          nickname: storedIdentity.displayName,
          avatar: storedAvatar,
        }));

        onComplete({
          success: true,
          identity: {
            address,
            nickname: storedIdentity.displayName!,
            avatar: storedAvatar,
          },
        });
      } else {
        try {
          const response = await fetch(`/api/nicknames/address/${address}`);
          if (response.ok) {
            const data = await response.json();
            if (data.nickname) {
              setState((prev) => ({
                ...prev,
                address,
                nickname: data.nickname,
                step: "profile",
              }));
              return;
            }
          }
        } catch {}

        setState((prev) => ({
          ...prev,
          address,
          step: "profile",
        }));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed";

      if (
        message.toLowerCase().includes("cancel") ||
        message.toLowerCase().includes("abort")
      ) {
        setState((prev) => ({
          ...prev,
          step: "welcome",
          error: null,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        step: "error",
        error: message,
      }));
    } finally {
      resetPorto();
    }
  }, [onComplete, storedIdentity]);

  const handleCreateAccount = useCallback(async () => {
    setState((prev) => ({ ...prev, step: "connecting", error: null }));

    try {
      if (!containerRef.current) throw new Error("Container not ready");

      const result = await createAccount({ container: containerRef.current });

      if (!result.success) {
        throw new Error(
          result.error.message || "No address returned from passkey creation",
        );
      }

      setState((prev) => ({
        ...prev,
        address: result.address as `0x${string}`,
        step: "profile",
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Account creation failed";

      if (
        message.toLowerCase().includes("cancel") ||
        message.toLowerCase().includes("abort")
      ) {
        setState((prev) => ({
          ...prev,
          step: "welcome",
          error: null,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        step: "error",
        error: message,
      }));
    } finally {
      resetPorto();
    }
  }, []);

  const handleProfileComplete = useCallback(
    async (nickname: string, avatar: AvatarConfig) => {
      if (!state.address) return;

      try {
        const response = await fetch("/api/nicknames/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: state.address,
            nickname,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to claim nickname");
        }

        setIdentity({
          address: state.address,
          displayName: nickname,
          avatar,
          createdAt: Date.now(),
        });

        setState((prev) => ({
          ...prev,
          nickname,
          avatar,
          step: "success",
        }));

        onComplete({
          success: true,
          identity: {
            address: state.address!,
            nickname,
            avatar,
          },
        });
      } catch (error) {
        console.error("Profile complete error:", error);
        setState((prev) => ({
          ...prev,
          step: "error",
          error:
            error instanceof Error ? error.message : "Failed to save profile",
        }));
      }
    },
    [state.address, setIdentity, onComplete],
  );

  const handleRetry = useCallback(() => {
    resetPorto();
    setState((prev) => ({
      ...prev,
      step: "welcome",
      error: null,
    }));
  }, []);

  const handleBack = useCallback(() => {
    setState((prev) => {
      switch (prev.step) {
        case "profile":
          return { ...prev, step: "welcome" };
        default:
          return prev;
      }
    });
  }, []);

  const checkNicknameAvailability = useCallback(async (nickname: string) => {
    try {
      const response = await fetch(
        `/api/nicknames/check?nickname=${encodeURIComponent(nickname)}`,
      );
      const data = await response.json();
      return {
        available: data.available,
        suggestion: data.suggestion,
      };
    } catch {
      return { available: true };
    }
  }, []);

  const pageVariants = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
      };

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.15, ease: "easeInOut" as const };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <div
        ref={containerRef}
        className={`
          fixed inset-0 z-50 bg-cream-50
          ${state.step === "connecting" ? "block" : "hidden"}
        `}
      />

      <AnimatePresence mode="wait">
        {state.step === "welcome" && (
          <motion.div
            key="welcome"
            {...pageVariants}
            transition={transition}
            className="flex-1"
          >
            <SignInWelcome
              onSignIn={handleSignIn}
              onCreateAccount={handleCreateAccount}
            />
          </motion.div>
        )}

        {state.step === "connecting" && (
          <motion.div
            key="connecting"
            {...pageVariants}
            transition={transition}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-accent-yellow animate-spin mx-auto" />
              <p className="text-ink-muted">Connecting...</p>
            </div>
          </motion.div>
        )}

        {state.step === "profile" && state.address && (
          <motion.div
            key="profile"
            {...pageVariants}
            transition={transition}
            className="flex-1"
          >
            <AuthProfile
              address={state.address}
              onBack={handleBack}
              onComplete={handleProfileComplete}
              checkAvailability={checkNicknameAvailability}
            />
          </motion.div>
        )}

        {state.step === "success" && (
          <motion.div
            key="success"
            {...pageVariants}
            transition={transition}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-serif text-ink">Welcome!</h2>
              <p className="text-ink-muted">
                {state.nickname
                  ? `@${state.nickname}`
                  : "Setting up your profile..."}
              </p>
            </div>
          </motion.div>
        )}

        {state.step === "error" && (
          <motion.div
            key="error"
            {...pageVariants}
            transition={transition}
            className="flex-1 flex items-center justify-center p-6"
          >
            <div className="text-center space-y-6 max-w-sm">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-2xl font-serif text-ink">
                  Something went wrong
                </h2>
                <p className="text-ink-muted text-sm">{state.error}</p>
              </div>
              <Button size="lg" onClick={handleRetry} className="w-full">
                Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
