"use client";

import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { AvatarPreview } from "./AvatarPreview";

interface AvatarBubbleProps {
  address: string;
  variant: number;
  onShuffle: () => void;
  isShuffling?: boolean;
}

export function AvatarBubble({
  address,
  variant,
  onShuffle,
  isShuffling = false,
}: AvatarBubbleProps) {
  return (
    <div className="relative inline-block">
      <div className="relative z-10">
        <AvatarPreview
          walletAddress={address}
          selection="other"
          variant={variant}
          size={120}
          className="rounded-full shadow-lg bg-cream-100"
        />
      </div>

      <motion.button
        onClick={onShuffle}
        whileTap={{ scale: 0.9 }}
        className="absolute -bottom-2 -right-2 z-20 p-2 bg-white rounded-full shadow-md border border-cream-200 text-ink hover:text-accent-brown transition-colors"
        aria-label="Shuffle avatar"
        type="button"
      >
        <motion.div
          animate={isShuffling ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <RefreshCw className="w-5 h-5" />
        </motion.div>
      </motion.button>
    </div>
  );
}
