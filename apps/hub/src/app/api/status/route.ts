import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const startTime = Date.now();

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function getEnvironment(): string {
  if (process.env.NODE_ENV !== "production") return "development";
  return process.env.NEXT_PUBLIC_CHAIN_ID === "84532"
    ? "staging"
    : "production";
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: process.env.npm_package_version || "0.1.0",
    environment: getEnvironment(),
    build: {
      id: process.env.NEXT_BUILD_ID || "unknown",
      sha: (process.env.NEXT_PUBLIC_GIT_SHA || "local").slice(0, 7),
      time: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
    },
    uptime: formatUptime(Date.now() - startTime),
    timestamp: new Date().toISOString(),
  });
}
