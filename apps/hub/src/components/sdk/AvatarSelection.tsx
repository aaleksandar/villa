"use client";

import { useState, useCallback } from "react";
import { Dices } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui";
import { AvatarPreview } from "./AvatarPreview";
import { createAvatarConfig } from "@/lib/avatar";
import type { AvatarStyleSelection, AvatarConfig } from "@/types";

interface AvatarSelectionProps {
  walletAddress: string;
  onSelect: (config: AvatarConfig) => void;
  timerDuration?: number;
}

const STYLE_OPTIONS: {
  value: AvatarStyleSelection;
  label: string;
  description: string;
}[] = [
  { value: "female", label: "Female", description: "Long hair styles" },
  { value: "male", label: "Male", description: "Short hair styles" },
  { value: "other", label: "Other", description: "Fun robots" },
];

export function AvatarSelection({
  walletAddress,
  onSelect,
}: AvatarSelectionProps) {
  const [selection, setSelection] = useState<AvatarStyleSelection>("female");
  const [variant, setVariant] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  const handleSelect = useCallback(() => {
    if (isSelecting) return;
    setIsSelecting(true);

    const config = createAvatarConfig(selection, variant);
    onSelect(config);
  }, [selection, variant, onSelect, isSelecting]);

  const handleRandomize = () => {
    setIsRolling(true);
    setVariant((v) => v + 1);
    setTimeout(() => setIsRolling(false), 500);
  };

  const handleStyleChange = (newSelection: AvatarStyleSelection) => {
    setSelection(newSelection);
    setVariant(0);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif text-ink">Pick your look</h2>
        <p className="text-ink-muted text-sm">
          Choose a style that represents you
        </p>
      </div>

      <div className="flex gap-3 justify-center max-w-sm mx-auto touch-pan-x">
        {STYLE_OPTIONS.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => handleStyleChange(option.value)}
            disabled={isSelecting}
            whileHover={
              !isSelecting && !shouldReduceMotion ? { scale: 1.05, y: -2 } : {}
            }
            whileTap={
              !isSelecting && !shouldReduceMotion ? { scale: 0.98 } : {}
            }
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`
              relative flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-w-11 min-h-11
              ${
                selection === option.value
                  ? "bg-accent-yellow border-2 border-accent-brown shadow-md"
                  : "bg-cream-100 border-2 border-transparent hover:border-cream-300"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {selection === option.value && !shouldReduceMotion && (
              <motion.div
                layoutId="glow"
                className="absolute inset-0 rounded-xl bg-accent-yellow opacity-50 blur-md"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <motion.div
              className="w-14 h-14 rounded-full overflow-hidden bg-cream-200 shadow-sm relative z-10"
              animate={
                selection === option.value && !shouldReduceMotion
                  ? {
                      scale: [1, 1.1, 1],
                    }
                  : {}
              }
              transition={{ duration: 0.3 }}
            >
              <AvatarPreview
                walletAddress={walletAddress}
                selection={option.value}
                variant={0}
                size={56}
              />
            </motion.div>
            <span className="text-sm font-medium text-ink relative z-10">
              {option.label}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <motion.div
            animate={
              !shouldReduceMotion
                ? {
                    scale: isRolling ? [1, 1.05, 1] : 1,
                    rotate: isRolling ? [0, -2, 2, -2, 0] : 0,
                  }
                : {}
            }
            transition={{ duration: 0.5 }}
          >
            <AvatarPreview
              walletAddress={walletAddress}
              selection={selection}
              variant={variant}
              size={160}
              className="shadow-lg rounded-full"
            />
          </motion.div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <motion.button
            onClick={handleRandomize}
            disabled={isSelecting}
            aria-label="Roll for new avatar"
            whileHover={
              !isSelecting && !shouldReduceMotion ? { scale: 1.05 } : {}
            }
            whileTap={
              !isSelecting && !shouldReduceMotion ? { scale: 0.95 } : {}
            }
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`
              group flex items-center gap-3 px-6 py-3 min-h-11
              bg-white border border-cream-200
              text-ink font-semibold rounded-full
              shadow-sm hover:shadow-md
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <motion.div
              animate={
                isRolling && !shouldReduceMotion
                  ? { rotate: 360 }
                  : { rotate: 0 }
              }
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Dices className="w-5 h-5" />
            </motion.div>
            <span>Shuffle</span>
          </motion.button>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full min-h-11"
        onClick={() => handleSelect()}
        disabled={isSelecting}
      >
        {isSelecting ? "Saving..." : "Select"}
      </Button>
    </div>
  );
}
