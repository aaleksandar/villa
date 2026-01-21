"use client";

import { useState, useEffect, useCallback } from "react";
import { villa, type VillaUser } from "@rockfridrich/villa-sdk";

export function useVilla() {
  const [user, setUser] = useState<VillaUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return villa.onAuthChange(setUser);
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await villa.signIn();
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    villa.signOut();
  }, []);

  return {
    user,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isLoading,
  };
}
