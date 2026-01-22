import { NextResponse } from "next/server";
import { getCached, setCache, CACHE_TTL } from "@/lib/cache";
import type { HealthProxyResponse, Environment } from "@/lib/types";
import { ENVIRONMENT_URLS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteParams = { params: Promise<{ env: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { env } = await params;

  if (!isValidEnvironment(env)) {
    return NextResponse.json(
      {
        error: `Invalid environment: ${env}. Valid: ${Object.keys(ENVIRONMENT_URLS).join(", ")}`,
      },
      { status: 400 },
    );
  }

  const cacheKey = `health:${env}`;
  const cached = getCached<HealthProxyResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const url = ENVIRONMENT_URLS[env];
  const start = Date.now();

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      const result: HealthProxyResponse = {
        environment: env,
        url,
        status: "error",
        latency,
        error: `HTTP ${response.status}`,
        fetchedAt: new Date().toISOString(),
      };
      setCache(cacheKey, result, CACHE_TTL.HEALTH);
      return NextResponse.json(result);
    }

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = {
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "static",
      };
    }

    const result: HealthProxyResponse = {
      environment: env,
      url,
      status: "ok",
      latency,
      data,
      fetchedAt: new Date().toISOString(),
    };

    setCache(cacheKey, result, CACHE_TTL.HEALTH);
    return NextResponse.json(result);
  } catch (error) {
    const result: HealthProxyResponse = {
      environment: env,
      url,
      status: "error",
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
      fetchedAt: new Date().toISOString(),
    };

    setCache(cacheKey, result, CACHE_TTL.HEALTH);
    return NextResponse.json(result);
  }
}

function isValidEnvironment(env: string): env is Environment {
  return env in ENVIRONMENT_URLS;
}
