import { NextResponse } from "next/server";
import { getCached, setCache, CACHE_TTL } from "@/lib/cache";
import { getWorkflowRuns } from "@/lib/github";
import type { GitHubActionsResponse, WorkflowRun } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 25);

  const cacheKey = `github:actions:${limit}`;
  const cached = getCached<GitHubActionsResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const rawRuns = await getWorkflowRuns(limit);

    const runs: WorkflowRun[] = rawRuns.map((run) => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.head_branch,
      sha: run.head_sha.slice(0, 7),
      url: run.html_url,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      duration: calculateDuration(run.run_started_at, run.updated_at),
    }));

    const result: GitHubActionsResponse = {
      runs,
      total: runs.length,
      fetchedAt: new Date().toISOString(),
    };

    setCache(cacheKey, result, CACHE_TTL.GITHUB_ACTIONS);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch workflow runs",
        hint: "Ensure gh CLI is installed and authenticated",
      },
      { status: 500 },
    );
  }
}

function calculateDuration(
  startTime: string,
  endTime: string,
): number | undefined {
  if (!startTime || !endTime) return undefined;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.round((end - start) / 1000);
}
