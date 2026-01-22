import { NextResponse } from "next/server";
import { getCached, setCache, CACHE_TTL } from "@/lib/cache";
import { getLatestDeployRun } from "@/lib/github";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface BuildStatusResponse {
  run: {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    url: string;
    sha: string;
    createdAt: string;
  } | null;
  jobs: Array<{
    name: string;
    status: string;
    conclusion: string | null;
    currentStep: string | null;
    totalSteps: number;
    completedSteps: number;
  }>;
  fetchedAt: string;
  error?: string;
}

export async function GET() {
  const cacheKey = "build:status";
  const cached = getCached<BuildStatusResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const deployRun = await getLatestDeployRun();

    if (!deployRun) {
      const result: BuildStatusResponse = {
        run: null,
        jobs: [],
        fetchedAt: new Date().toISOString(),
        error: "No deploy runs found",
      };
      return NextResponse.json(result);
    }

    const jobs = deployRun.jobs.map((job) => {
      const completedSteps = job.steps.filter(
        (s) => s.status === "completed",
      ).length;
      const inProgressStep = job.steps.find((s) => s.status === "in_progress");

      return {
        name: job.name,
        status: job.status,
        conclusion: job.conclusion,
        currentStep: inProgressStep?.name || null,
        totalSteps: job.steps.length,
        completedSteps,
      };
    });

    const result: BuildStatusResponse = {
      run: {
        id: deployRun.id,
        name: deployRun.name,
        status: deployRun.status,
        conclusion: deployRun.conclusion,
        url: deployRun.html_url,
        sha: deployRun.head_sha,
        createdAt: deployRun.created_at,
      },
      jobs,
      fetchedAt: new Date().toISOString(),
    };

    setCache(cacheKey, result, CACHE_TTL.BUILD_STATUS);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        run: null,
        jobs: [],
        fetchedAt: new Date().toISOString(),
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch build status",
      },
      { status: 500 },
    );
  }
}
