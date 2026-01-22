import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

const VILLA_ROOT = process.env.VILLA_ROOT || "/Users/me/Documents/Coding/villa";

const SAFE_ACTIONS: Record<
  string,
  { command: string; description: string; timeout?: number }
> = {
  "launch-local": {
    command: `cd ${VILLA_ROOT} && bun run dev &`,
    description: "Start local dev server (bun run dev)",
    timeout: 5000,
  },
  "launch-docker": {
    command: `cd ${VILLA_ROOT} && docker compose --profile dev up -d`,
    description: "Start Docker dev environment",
    timeout: 30000,
  },
  "stop-docker": {
    command: `cd ${VILLA_ROOT} && docker compose down`,
    description: "Stop Docker containers",
    timeout: 15000,
  },
  "docker-status": {
    command: "docker compose ps --format json 2>/dev/null || echo '[]'",
    description: "Get Docker container status",
    timeout: 5000,
  },
  "check-port-3000": {
    command: "lsof -i :3000 -t 2>/dev/null | head -1 || echo ''",
    description: "Check if port 3000 is in use",
    timeout: 3000,
  },
  "git-status": {
    command: `cd ${VILLA_ROOT} && git status --short`,
    description: "Get git status",
    timeout: 5000,
  },
  "recent-logs": {
    command: `cd ${VILLA_ROOT} && git log --oneline -10`,
    description: "Get recent git commits",
    timeout: 5000,
  },
};

export async function POST(request: Request) {
  try {
    const { action }: { action: string } = await request.json();

    if (!action || !SAFE_ACTIONS[action]) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown action: ${action}`,
          availableActions: Object.keys(SAFE_ACTIONS),
        },
        { status: 400 },
      );
    }

    const { command, description, timeout = 10000 } = SAFE_ACTIONS[action];

    const { stdout, stderr } = await execAsync(command, {
      timeout,
      cwd: VILLA_ROOT,
    });

    return NextResponse.json({
      success: true,
      action,
      description,
      output: stdout.trim(),
      stderr: stderr.trim() || undefined,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isTimeout = errorMessage.includes("TIMEOUT");

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        hint: isTimeout
          ? "Command timed out - it may still be running in background"
          : undefined,
      },
      { status: isTimeout ? 202 : 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    availableActions: Object.entries(SAFE_ACTIONS).map(([key, value]) => ({
      action: key,
      description: value.description,
    })),
  });
}
