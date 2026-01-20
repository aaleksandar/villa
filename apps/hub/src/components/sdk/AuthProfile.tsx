"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui";
import { AvatarBubble } from "./AvatarBubble";
import { generateFriendlyNickname } from "@/lib/random-name";
import { createAvatarConfig } from "@/lib/avatar";
import type { AvatarConfig } from "@/types";

interface AuthProfileProps {
  address: string;
  onBack: () => void;
  onComplete: (nickname: string, avatar: AvatarConfig) => void;
  checkAvailability: (nickname: string) => Promise<{ available: boolean }>;
}

export function AuthProfile({
  address,
  onBack,
  onComplete,
  checkAvailability,
}: AuthProfileProps) {
  const [nickname, setNickname] = useState("");
  const [variant, setVariant] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initialName = generateFriendlyNickname(address);
    setNickname(initialName);
    setVariant(Math.floor(Math.random() * 20));
  }, [address]);

  const handleShuffle = () => {
    setIsShuffling(true);
    setVariant((prev) => prev + 1);
    setTimeout(() => setIsShuffling(false), 250);
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
    setNickname(val);
    setIsAvailable(false);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (val.length >= 3) {
      setIsChecking(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const result = await checkAvailability(val);
          setIsAvailable(result.available);
        } catch {
          setIsAvailable(true);
        } finally {
          setIsChecking(false);
        }
      }, 300);
    } else {
      setIsChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!isAvailable || nickname.length < 3) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const avatar = createAvatarConfig("other", variant);
      onComplete(nickname, avatar);
    }, 500);
  };

  const isValid = nickname.length >= 3 && isAvailable && !isChecking;

  return (
    <div className="flex flex-col h-full relative p-6">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 p-2 -ml-2 rounded-full hover:bg-cream-100 transition-colors z-10"
        aria-label="Go back"
      >
        <ArrowLeft className="w-6 h-6 text-ink" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif text-ink">Almost there!</h2>
          <p className="text-ink-muted text-sm">Customize your profile</p>
        </div>

        <AvatarBubble
          address={address}
          variant={variant}
          onShuffle={handleShuffle}
          isShuffling={isShuffling}
        />

        <div className="w-full max-w-sm space-y-2">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink text-base pointer-events-none">
              @
            </span>
            <input
              type="text"
              value={nickname}
              onChange={handleNicknameChange}
              className="w-full h-12 pl-9 pr-12 bg-cream-50 border-2 border-cream-200 rounded-xl text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
              placeholder="nickname"
              maxLength={30}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isChecking ? (
                <Loader2 className="w-5 h-5 text-ink-muted animate-spin" />
              ) : nickname.length >= 3 ? (
                isAvailable ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <X className="w-5 h-5 text-red-500" />
                )
              ) : null}
            </div>
          </div>
          <p className="text-xs text-center text-ink-muted">
            {nickname.length < 3
              ? "At least 3 characters"
              : !isAvailable && !isChecking
                ? "Username taken"
                : "You can change this later"}
          </p>
        </div>

        <Button
          size="lg"
          className="w-full max-w-sm"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
