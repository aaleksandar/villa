"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { ProfileSettingsModal } from "@/components/settings/ProfileSettingsModal";
import { useIdentityStore } from "@/lib/store";
import { disconnectPorto } from "@/lib/porto";
import type { AvatarConfig } from "@/types";

interface AppLayoutProps {
  children: React.ReactNode;
  activeNavId?: string;
  ecosystemApps?: { id: string; name: string; icon?: string; url?: string }[];
}

export function AppLayout({
  children,
  activeNavId = "home",
  ecosystemApps = [],
}: AppLayoutProps) {
  const router = useRouter();
  const { identity, clearIdentity } = useIdentityStore();
  const [showSettings, setShowSettings] = useState(false);
  const [currentNavId, setCurrentNavId] = useState(activeNavId);

  const handleNavigate = useCallback(
    (id: string) => {
      setCurrentNavId(id);

      if (id === "home") {
        router.push("/home");
      } else if (id === "ecosystem") {
        router.push("/home");
      } else if (id === "profile") {
        setShowSettings(true);
      } else if (id.startsWith("app-")) {
        const appId = id.replace("app-", "");
        const app = ecosystemApps.find((a) => a.id === appId);
        if (app?.url) {
          window.open(app.url, "_blank", "noopener,noreferrer");
        }
      }
    },
    [router, ecosystemApps],
  );

  const handleLogout = useCallback(async () => {
    await disconnectPorto();
    clearIdentity();
    router.replace("/onboarding");
  }, [clearIdentity, router]);

  if (!identity) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="animate-spin w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full" />
      </main>
    );
  }

  const avatarConfig: AvatarConfig | string | undefined =
    identity.avatar && typeof identity.avatar === "object"
      ? (identity.avatar as AvatarConfig)
      : identity.avatar;

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar
        activeId={currentNavId}
        onNavigate={handleNavigate}
        user={{
          displayName: identity.displayName,
          address: identity.address,
          avatar: avatarConfig,
        }}
        onSettingsClick={() => setShowSettings(true)}
        onLogout={handleLogout}
        ecosystemApps={ecosystemApps}
      />

      <main className={clsx("flex-1 min-h-screen", "pb-20 sm:pb-0")}>
        {children}
      </main>

      <BottomNav activeId={currentNavId} onNavigate={handleNavigate} />

      <ProfileSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}
