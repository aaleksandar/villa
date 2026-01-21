"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Spinner } from "@/components/ui";
import { ProfileSettings } from "@/components/sdk";
import type { ProfileData, ProfileUpdate } from "@/components/sdk";
import type { AvatarConfig } from "@/types";
import type { CustomAvatar } from "@/lib/storage/tinycloud";
import { useIdentityStore } from "@/lib/store";

export default function SettingsPage() {
  const router = useRouter();
  const { identity, updateProfile } = useIdentityStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!identity?.address) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${identity.address}`);
        const data = await res.json();

        let avatarConfig: AvatarConfig | CustomAvatar;

        if (!identity.avatar || typeof identity.avatar === "string") {
          avatarConfig = {
            style: "avataaars" as const,
            selection: "other" as const,
            variant: 0,
          };
        } else {
          avatarConfig = identity.avatar;
        }

        setProfile({
          address: identity.address,
          nickname: data.nickname,
          displayName: identity.displayName || data.nickname || "",
          avatar: avatarConfig,
          canChangeNickname: data.canChangeNickname ?? true,
          nicknameChangeCount: data.nicknameChangeCount ?? 0,
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [identity]);

  useEffect(() => {
    if (!identity) {
      router.replace("/onboarding");
    }
  }, [identity, router]);

  if (!identity) {
    return null;
  }

  const handleProfileUpdate = async (updates: ProfileUpdate) => {
    if (!identity) return;

    try {
      if (updates.nickname) {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: identity.address,
            newNickname: updates.nickname,
          }),
        });
      }

      if (updates.displayName !== undefined || updates.avatar !== undefined) {
        let avatarForStore:
          | string
          | {
              style: "avataaars" | "bottts";
              selection: "male" | "female" | "other";
              variant: number;
            }
          | undefined;

        if (updates.avatar) {
          const isCustom =
            "type" in updates.avatar && updates.avatar.type === "custom";
          if (isCustom) {
            avatarForStore = (updates.avatar as CustomAvatar).dataUrl;
          } else {
            const config = updates.avatar as AvatarConfig;
            avatarForStore = {
              style: config.style,
              selection: config.selection,
              variant: config.variant,
            };
          }
        }

        updateProfile(
          updates.displayName ?? identity.displayName,
          avatarForStore,
        );
      }

      const res = await fetch(`/api/profile/${identity.address}`);
      const data = await res.json();

      const avatarSource = updates.avatar ?? identity.avatar;
      let avatarConfig: AvatarConfig | CustomAvatar;

      if (!avatarSource || typeof avatarSource === "string") {
        avatarConfig = {
          style: "avataaars" as const,
          selection: "other" as const,
          variant: 0,
        };
      } else {
        avatarConfig = avatarSource;
      }

      setProfile({
        address: identity.address,
        nickname: data.nickname,
        displayName: updates.displayName ?? identity.displayName,
        avatar: avatarConfig,
        canChangeNickname: data.canChangeNickname ?? true,
        nicknameChangeCount: data.nicknameChangeCount ?? 0,
      });
    } catch (err) {
      console.error("Failed to update profile:", err);
      throw err;
    }
  };

  return (
    <main className="min-h-screen bg-cream-50 p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/home")}
          className="p-2 hover:bg-cream-100 rounded-lg transition-colors min-h-11 min-w-11 flex items-center justify-center"
          aria-label="Back to home"
        >
          <ChevronLeft className="h-5 w-5 text-ink" />
        </button>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
      </div>

      {loadingProfile ? (
        <div className="bg-cream-100 rounded-lg p-4 flex items-center gap-3">
          <Spinner size="sm" />
          <p className="text-ink-muted">Loading profile...</p>
        </div>
      ) : profile ? (
        <ProfileSettings
          profile={profile}
          onUpdate={handleProfileUpdate}
          asModal={false}
        />
      ) : null}
    </main>
  );
}
