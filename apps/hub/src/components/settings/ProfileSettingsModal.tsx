"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  LogOut,
  Globe,
  ExternalLink,
  Check,
} from "lucide-react";
import { clsx } from "clsx";
import { Modal } from "@/components/ui/Modal";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button, Input, Avatar } from "@/components/ui";
import { AvatarPicker } from "./AvatarPicker";
import { useIdentityStore } from "@/lib/store";
import { nicknameSchema } from "@/lib/validation";
import { disconnectPorto } from "@/lib/porto";
import { useRouter } from "next/navigation";
import type { AvatarConfig } from "@/types";

type SettingsView = "main" | "avatar" | "username";

interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettingsModal({
  open,
  onOpenChange,
}: ProfileSettingsModalProps) {
  const router = useRouter();
  const { identity, updateProfile, clearIdentity } = useIdentityStore();
  const [view, setView] = useState<SettingsView>("main");
  const [isMobile, setIsMobile] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (open) {
      setView("main");
      setNickname(identity?.displayName || "");
      setNicknameError(null);
    }
  }, [open, identity?.displayName]);

  const handleAvatarSelect = useCallback(
    async (config: AvatarConfig) => {
      if (!identity) return;

      updateProfile(identity.displayName, config);
      setView("main");
    },
    [identity, updateProfile],
  );

  const handleUsernameSave = useCallback(async () => {
    if (!identity) return;

    const cleanNickname = nickname.startsWith("@")
      ? nickname.slice(1)
      : nickname;
    const result = nicknameSchema.safeParse(cleanNickname);

    if (!result.success) {
      setNicknameError(result.error.errors[0]?.message || "Invalid nickname");
      return;
    }

    if (result.data === identity.displayName) {
      setView("main");
      return;
    }

    setIsSaving(true);
    setNicknameError(null);

    try {
      const response = await fetch("/api/nicknames/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: identity.address,
          nickname: result.data,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update nickname");
      }

      updateProfile(result.data);
      setView("main");
    } catch (error) {
      setNicknameError(
        error instanceof Error ? error.message : "Failed to save",
      );
    } finally {
      setIsSaving(false);
    }
  }, [identity, nickname, updateProfile]);

  const handleLogout = useCallback(async () => {
    await disconnectPorto();
    clearIdentity();
    onOpenChange(false);
    router.replace("/onboarding");
  }, [clearIdentity, onOpenChange, router]);

  const renderContent = () => {
    if (!identity) return null;

    const avatarConfig: AvatarConfig | string | undefined =
      identity.avatar && typeof identity.avatar === "object"
        ? (identity.avatar as AvatarConfig)
        : identity.avatar;

    if (view === "avatar") {
      return (
        <div className="space-y-4">
          <button
            onClick={() => setView("main")}
            className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors min-h-11 -ml-2 px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <AvatarPicker
            walletAddress={identity.address}
            currentAvatar={
              typeof avatarConfig === "object" ? avatarConfig : undefined
            }
            onSelect={handleAvatarSelect}
            onCancel={() => setView("main")}
          />
        </div>
      );
    }

    if (view === "username") {
      return (
        <div className="space-y-6">
          <button
            onClick={() => setView("main")}
            className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors min-h-11 -ml-2 px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-serif text-ink">Change Username</h3>
              <p className="text-sm text-ink-muted">
                Your username is your unique identifier on Villa
              </p>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
                  @
                </span>
                <Input
                  value={nickname}
                  onChange={(e) => {
                    setNickname(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""),
                    );
                    setNicknameError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleUsernameSave()}
                  className="pl-8"
                  maxLength={30}
                  disabled={isSaving}
                  error={nicknameError || undefined}
                />
              </div>
              <p className="text-xs text-ink-muted">
                3-30 characters, letters and numbers only
              </p>
            </div>

            <Button
              onClick={handleUsernameSave}
              disabled={isSaving || !nickname}
              className="w-full"
            >
              {isSaving ? "Saving..." : "Save Username"}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar
              name={identity.displayName}
              src={avatarConfig}
              walletAddress={identity.address}
              size="lg"
              className="ring-4 ring-cream-200"
            />
            <button
              onClick={() => setView("avatar")}
              className={clsx(
                "absolute -bottom-1 -right-1",
                "w-10 h-10 rounded-full",
                "bg-accent-yellow text-accent-brown",
                "flex items-center justify-center",
                "shadow-sm hover:shadow-md transition-shadow",
                "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
              )}
              aria-label="Change avatar"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setView("username")}
            className="group flex items-center gap-2 text-xl font-serif text-ink hover:text-accent-brown transition-colors"
          >
            <span>@{identity.displayName}</span>
            <span className="text-xs text-ink-muted group-hover:text-accent-brown">
              Edit
            </span>
          </button>
        </div>

        <div className="space-y-2">
          <SettingsRow
            icon={<Globe className="w-5 h-5" />}
            label="Villa Name"
            value={`${identity.displayName}.villa.cash`}
            action={<CopyButton text={`${identity.displayName}.villa.cash`} />}
          />

          <SettingsRow
            icon={<ExternalLink className="w-5 h-5" />}
            label="Enable on other websites"
            description="Use your Villa ID to sign in to supported apps"
            action={<div className="text-xs text-ink-muted">Coming soon</div>}
          />
        </div>

        <div className="pt-4 border-t border-neutral-100">
          <Button variant="secondary" onClick={handleLogout} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
          <p className="text-xs text-ink-muted text-center mt-2">
            Your passkey stays active for quick sign-in
          </p>
        </div>
      </div>
    );
  };

  const title =
    view === "main"
      ? "Profile Settings"
      : view === "avatar"
        ? "Change Avatar"
        : "Change Username";

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange} title={title}>
        <div className="px-6 py-4 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={
                shouldReduceMotion
                  ? {}
                  : { opacity: 0, x: view === "main" ? -20 : 20 }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                shouldReduceMotion
                  ? {}
                  : { opacity: 0, x: view === "main" ? 20 : -20 }
              }
              transition={{ duration: 0.15 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </BottomSheet>
    );
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} size="sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={
            shouldReduceMotion
              ? {}
              : { opacity: 0, x: view === "main" ? -20 : 20 }
          }
          animate={{ opacity: 1, x: 0 }}
          exit={
            shouldReduceMotion
              ? {}
              : { opacity: 0, x: view === "main" ? 20 : -20 }
          }
          transition={{ duration: 0.15 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
}

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  description?: string;
  action?: React.ReactNode;
  onClick?: () => void;
}

function SettingsRow({
  icon,
  label,
  value,
  description,
  action,
  onClick,
}: SettingsRowProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-3 p-4 rounded-xl",
        "bg-cream-100",
        onClick && "hover:bg-cream-200 transition-colors cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
      )}
    >
      <span className="text-ink-muted">{icon}</span>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-ink">{label}</p>
        {value && <p className="text-xs text-ink-muted mt-0.5">{value}</p>}
        {description && (
          <p className="text-xs text-ink-muted mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </Component>
  );
}

interface CopyButtonProps {
  text: string;
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        "p-2 rounded-lg min-h-11 min-w-11 flex items-center justify-center",
        "text-ink-muted hover:text-ink hover:bg-cream-200",
        "transition-colors duration-150",
        "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
      )}
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="w-4 h-4 text-success-text" />
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}
