import { NextResponse } from "next/server";
import { getCached, setCache, CACHE_TTL } from "@/lib/cache";
import { getRecentCommits } from "@/lib/github";
import type { GitHubCommitsResponse, CommitInfo } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 25);

  const cacheKey = `github:commits:${limit}`;
  const cached = getCached<GitHubCommitsResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const rawCommits = await getRecentCommits(limit);

    const commits: CommitInfo[] = rawCommits.map((commit) => ({
      sha: commit.sha,
      shortSha: commit.sha.slice(0, 7),
      message: commit.commit.message.split("\n")[0].slice(0, 72),
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url,
    }));

    const result: GitHubCommitsResponse = {
      commits,
      fetchedAt: new Date().toISOString(),
    };

    setCache(cacheKey, result, CACHE_TTL.GITHUB_COMMITS);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch commits",
        hint: "Ensure gh CLI is installed and authenticated",
      },
      { status: 500 },
    );
  }
}
