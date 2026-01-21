"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

interface AuthenticatingStateProps {
  message?: string;
}

export function AuthenticatingState({
  message = "Connecting...",
}: AuthenticatingStateProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <motion.div
        animate={shouldReduceMotion ? {} : { rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="w-12 h-12 text-accent-yellow" />
      </motion.div>
      <p className="text-ink-muted text-center">{message}</p>
      <p className="text-xs text-ink-muted text-center max-w-[240px]">
        Complete the passkey prompt in your browser or device
      </p>
    </div>
  );
}

interface SuccessStateProps {
  nickname?: string;
  onComplete?: () => void;
}

export function SuccessState({ nickname, onComplete }: SuccessStateProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <motion.div
        initial={shouldReduceMotion ? {} : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={
          shouldReduceMotion
            ? {}
            : { type: "spring", stiffness: 200, damping: 15 }
        }
        onAnimationComplete={onComplete}
      >
        <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-success-text" />
        </div>
      </motion.div>
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.2 }}
        className="text-center space-y-1"
      >
        <h3 className="text-xl font-serif text-ink">
          Welcome{nickname ? ` back` : ""}!
        </h3>
        {nickname && <p className="text-ink-muted">@{nickname}</p>}
      </motion.div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onCancel?: () => void;
}

export function ErrorState({ message, onRetry, onCancel }: ErrorStateProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <motion.div
        initial={shouldReduceMotion ? {} : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={
          shouldReduceMotion
            ? {}
            : { type: "spring", stiffness: 200, damping: 15 }
        }
      >
        <div className="w-16 h-16 rounded-full bg-error-bg flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-error-text" />
        </div>
      </motion.div>

      <div className="text-center space-y-2 max-w-[280px]">
        <h3 className="text-xl font-serif text-ink">Something went wrong</h3>
        <p className="text-sm text-ink-muted">{message}</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-[240px]">
        <Button onClick={onRetry} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
