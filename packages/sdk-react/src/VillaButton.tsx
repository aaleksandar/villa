"use client";

import React from "react";
import { useVilla } from "./useVilla";

export interface VillaButtonProps {
  onSignIn?: (user: { address: string; nickname: string }) => void;
  onSignOut?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function VillaButton({
  onSignIn,
  onSignOut,
  className,
  style,
}: VillaButtonProps) {
  const { user, signIn, signOut, isLoading } = useVilla();

  const handleClick = async () => {
    if (user) {
      signOut();
      onSignOut?.();
    } else {
      const result = await signIn();
      if (result) {
        onSignIn?.({ address: result.address, nickname: result.nickname });
      }
    }
  };

  const defaultStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: 500,
    borderRadius: "12px",
    border: "none",
    cursor: isLoading ? "wait" : "pointer",
    transition: "all 0.15s ease",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    ...(user
      ? {
          backgroundColor: "#f5f5f5",
          color: "#333",
        }
      : {
          backgroundColor: "#FFE047",
          color: "#5C4813",
        }),
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      style={className ? style : { ...defaultStyle, ...style }}
    >
      {isLoading ? (
        "Connecting..."
      ) : user ? (
        <>
          <img
            src={user.avatar}
            alt=""
            style={{ width: 24, height: 24, borderRadius: "50%" }}
          />
          @{user.nickname}
        </>
      ) : (
        "Sign in with Villa"
      )}
    </button>
  );
}
