"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, RefreshCw, ExternalLink, X } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui";

type FrameState = "loading" | "ready" | "error";

interface EcosystemFrameProps {
  url: string;
  title: string;
  onClose?: () => void;
  className?: string;
}

const LOAD_TIMEOUT = 30000;

export function EcosystemFrame({
  url,
  title,
  onClose,
  className,
}: EcosystemFrameProps) {
  const [state, setState] = useState<FrameState>("loading");
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLoad = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState("ready");
  }, []);

  const handleError = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState("error");
    setError("Failed to load the app. Please try again.");
  }, []);

  const handleRetry = useCallback(() => {
    setState("loading");
    setError(null);

    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  }, [url]);

  const handleOpenExternal = useCallback(() => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, [url]);

  useEffect(() => {
    setState("loading");
    setError(null);

    timeoutRef.current = setTimeout(() => {
      setState((currentState) => {
        if (currentState === "loading") {
          setError("The app took too long to load. Try opening it externally.");
          return "error";
        }
        return currentState;
      });
    }, LOAD_TIMEOUT);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [url]);

  return (
    <div
      className={clsx(
        "relative flex flex-col bg-cream-50 rounded-xl overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-cream-100 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>

        <h3 className="text-sm font-medium text-ink truncate max-w-[200px]">
          {title}
        </h3>

        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenExternal}
            className={clsx(
              "p-2 rounded-lg min-h-11 min-w-11 flex items-center justify-center",
              "text-ink-muted hover:text-ink hover:bg-cream-200",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
            )}
            aria-label="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className={clsx(
                "p-2 rounded-lg min-h-11 min-w-11 flex items-center justify-center",
                "text-ink-muted hover:text-ink hover:bg-cream-200",
                "transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
              )}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative flex-1 min-h-[400px]">
        <AnimatePresence>
          {state === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-cream-50"
            >
              <Loader2 className="w-10 h-10 text-accent-yellow animate-spin" />
              <p className="mt-4 text-sm text-ink-muted">Loading {title}...</p>
            </motion.div>
          )}

          {state === "error" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-cream-50 p-6"
            >
              <div className="w-16 h-16 rounded-full bg-error-bg flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-error-text" />
              </div>
              <h3 className="text-lg font-serif text-ink mb-2">
                Unable to load app
              </h3>
              <p className="text-sm text-ink-muted text-center max-w-[280px] mb-6">
                {error}
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
                <Button onClick={handleOpenExternal}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Externally
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <iframe
          ref={iframeRef}
          src={url}
          title={title}
          onLoad={handleLoad}
          onError={handleError}
          className={clsx(
            "w-full h-full border-0",
            state !== "ready" && "invisible",
          )}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}

interface EcosystemFrameGridProps {
  apps: Array<{
    id: string;
    name: string;
    url: string;
    icon?: string;
  }>;
  onAppSelect?: (appId: string) => void;
}

export function EcosystemFrameGrid({
  apps,
  onAppSelect,
}: EcosystemFrameGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {apps.map((app) => (
        <button
          key={app.id}
          onClick={() => onAppSelect?.(app.id)}
          className={clsx(
            "flex flex-col items-center gap-3 p-4 rounded-xl",
            "bg-cream-100 hover:bg-cream-200",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
            "min-h-[100px]",
          )}
        >
          {app.icon ? (
            <img
              src={app.icon}
              alt=""
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-yellow to-villa-600 flex items-center justify-center">
              <span className="text-xl font-serif text-accent-brown">
                {app.name.charAt(0)}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-ink text-center">
            {app.name}
          </span>
        </button>
      ))}
    </div>
  );
}
