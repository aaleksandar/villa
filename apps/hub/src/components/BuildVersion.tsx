"use client";

import { useState } from "react";

export function BuildVersion() {
  const [showDetails, setShowDetails] = useState(false);

  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || "unknown";
  const gitSha = process.env.NEXT_PUBLIC_GIT_SHA || "local";
  const shortSha = gitSha.slice(0, 7);

  const formattedTime =
    buildTime !== "unknown" ? new Date(buildTime).toLocaleString() : "unknown";

  return (
    <button
      onClick={() => setShowDetails(!showDetails)}
      className="fixed bottom-2 right-2 z-50 text-[10px] text-ink-muted/50 hover:text-ink-muted transition-colors font-mono"
      aria-label="Build version"
    >
      {showDetails ? (
        <span className="bg-cream-100 px-2 py-1 rounded shadow-sm">
          {shortSha} · {formattedTime}
        </span>
      ) : (
        <span>{shortSha}</span>
      )}
    </button>
  );
}
