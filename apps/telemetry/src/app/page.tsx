"use client";

import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";

interface HealthData {
  status: string;
  timestamp: string;
  version?: string;
  build?: {
    version: string;
    hash: string;
    sha: string;
    time: string;
  };
  runtime?: {
    uptime: number;
    memory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
    node: string;
  };
  env?: string;
}

interface HealthProxyResponse {
  environment: string;
  url: string;
  status: "ok" | "error";
  latency: number;
  data?: HealthData;
  error?: string;
  fetchedAt: string;
}

interface ServiceStatus {
  name: string;
  env: string;
  status: "checking" | "ok" | "error";
  latency?: number;
  data?: HealthData;
  error?: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  sha: string;
  url: string;
  createdAt: string;
  duration?: number;
}

interface CommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface PipelineStage {
  name: string;
  status: "success" | "running" | "failed" | "pending";
  url?: string;
  details?: string;
}

interface PipelineData {
  stages: PipelineStage[];
  lastCommit: CommitInfo | null;
  lastDeploy: {
    production: string | null;
    staging: string | null;
  };
  fetchedAt: string;
}

const ENVIRONMENTS = [
  { name: "Local Hub", env: "local" },
  { name: "Staging", env: "staging" },
  { name: "Production", env: "production" },
  { name: "Developers", env: "developers" },
];

function StatusBadge({ status }: { status: ServiceStatus["status"] }) {
  return (
    <span
      className={clsx(
        "px-2 py-1 rounded-full text-xs font-medium",
        status === "checking" && "bg-yellow-100 text-yellow-800",
        status === "ok" && "bg-green-100 text-green-800",
        status === "error" && "bg-red-100 text-red-800",
      )}
    >
      {status === "checking" ? "..." : status.toUpperCase()}
    </span>
  );
}

function PipelineStatusBadge({ status }: { status: PipelineStage["status"] }) {
  return (
    <span
      className={clsx(
        "px-2 py-1 rounded-full text-xs font-medium",
        status === "pending" && "bg-gray-100 text-gray-800",
        status === "running" && "bg-blue-100 text-blue-800",
        status === "success" && "bg-green-100 text-green-800",
        status === "failed" && "bg-red-100 text-red-800",
      )}
    >
      {status.toUpperCase()}
    </span>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function ServiceCard({ service }: { service: ServiceStatus }) {
  const build = service.data?.build;
  const runtime = service.data?.runtime;
  const version = build?.version || service.data?.version || "unknown";

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-ink">{service.name}</h3>
        <StatusBadge status={service.status} />
      </div>

      {service.status === "ok" && service.data && (
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">Version:</span>
              <span className="ml-2 font-mono">{version}</span>
            </div>
            {build && (
              <div>
                <span className="text-gray-500">Hash:</span>
                <span className="ml-2 font-mono text-xs">{build.hash}</span>
              </div>
            )}
          </div>

          {build && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">SHA:</span>
                <span className="ml-2 font-mono text-xs">
                  {build.sha.slice(0, 7)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Env:</span>
                <span className="ml-2">{service.data?.env || "unknown"}</span>
              </div>
            </div>
          )}

          {runtime && (
            <div className="pt-2 border-t border-neutral-100">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Uptime:</span>
                  <span className="ml-1">{formatUptime(runtime.uptime)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Memory:</span>
                  <span className="ml-1">{runtime.memory.heapUsed}MB</span>
                </div>
                <div>
                  <span className="text-gray-500">Latency:</span>
                  <span className="ml-1">{service.latency}ms</span>
                </div>
              </div>
            </div>
          )}

          {build?.time && (
            <div className="text-xs text-gray-500 pt-1">
              Built: {build.time}
            </div>
          )}
        </div>
      )}

      {service.status === "error" && (
        <div className="text-sm text-red-600">{service.error}</div>
      )}

      {service.status === "checking" && (
        <div className="text-sm text-gray-500">Checking...</div>
      )}
    </div>
  );
}

function BuildComparison({ services }: { services: ServiceStatus[] }) {
  const builds = services
    .filter((s) => s.status === "ok" && s.data)
    .map((s) => ({
      name: s.name,
      hash: s.data?.build?.hash || "n/a",
      sha: s.data?.build?.sha || "n/a",
      version: s.data?.build?.version || s.data?.version || "unknown",
    }));

  if (builds.length < 2) return null;

  const allSameHash = builds.every(
    (b) => b.hash === builds[0].hash || b.hash === "n/a",
  );
  const allSameSha = builds.every(
    (b) => b.sha === builds[0].sha || b.sha === "n/a",
  );

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <h3 className="font-medium text-ink mb-3">Build Comparison</h3>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "w-3 h-3 rounded-full",
              allSameHash ? "bg-green-500" : "bg-yellow-500",
            )}
          />
          <span className="text-sm">
            {allSameHash
              ? "All builds have same content hash"
              : "Content hash mismatch detected"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "w-3 h-3 rounded-full",
              allSameSha ? "bg-green-500" : "bg-yellow-500",
            )}
          />
          <span className="text-sm">
            {allSameSha
              ? "All builds from same commit"
              : "Different commits deployed"}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-neutral-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left py-1">Environment</th>
              <th className="text-left py-1">Version</th>
              <th className="text-left py-1">Hash</th>
              <th className="text-left py-1">SHA</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {builds.map((b) => (
              <tr key={b.name}>
                <td className="py-1">{b.name}</td>
                <td className="py-1">{b.version}</td>
                <td className="py-1">{b.hash}</td>
                <td className="py-1">{b.sha.slice(0, 7)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PipelineCard({ pipeline }: { pipeline: PipelineData | null }) {
  if (!pipeline) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="font-medium text-ink mb-3">Pipeline Status</h3>
        <div className="text-sm text-gray-500">Loading pipeline data...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <h3 className="font-medium text-ink mb-3">Pipeline Status</h3>

      <div className="flex items-center gap-2 mb-4">
        {pipeline.stages.map((stage, idx) => (
          <div key={stage.name} className="flex items-center">
            {idx > 0 && <span className="mx-2 text-gray-300">→</span>}
            <div className="flex flex-col items-center">
              <a
                href={stage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                <PipelineStatusBadge status={stage.status} />
              </a>
              <span className="text-xs text-gray-500 mt-1">{stage.name}</span>
            </div>
          </div>
        ))}
      </div>

      {pipeline.lastCommit && (
        <div className="text-xs border-t border-neutral-100 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Last commit:</span>
            <a
              href={pipeline.lastCommit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-600 hover:underline"
            >
              {pipeline.lastCommit.shortSha}
            </a>
            <span className="text-gray-700 truncate max-w-[200px]">
              {pipeline.lastCommit.message}
            </span>
            <span className="text-gray-400">
              {formatRelativeTime(pipeline.lastCommit.date)}
            </span>
          </div>
        </div>
      )}

      {(pipeline.lastDeploy.production || pipeline.lastDeploy.staging) && (
        <div className="text-xs mt-2 flex gap-4">
          {pipeline.lastDeploy.staging && (
            <span>
              <span className="text-gray-500">Staging:</span>{" "}
              <span className="font-mono">{pipeline.lastDeploy.staging}</span>
            </span>
          )}
          {pipeline.lastDeploy.production && (
            <span>
              <span className="text-gray-500">Production:</span>{" "}
              <span className="font-mono">
                {pipeline.lastDeploy.production}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function WorkflowCard({ runs }: { runs: WorkflowRun[] }) {
  if (runs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="font-medium text-ink mb-3">GitHub Actions</h3>
        <div className="text-sm text-gray-500">Loading workflow runs...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <h3 className="font-medium text-ink mb-3">GitHub Actions</h3>
      <div className="space-y-2">
        {runs.slice(0, 5).map((run) => (
          <div
            key={run.id}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  "w-2 h-2 rounded-full",
                  run.conclusion === "success" && "bg-green-500",
                  run.conclusion === "failure" && "bg-red-500",
                  run.conclusion === null &&
                    run.status === "in_progress" &&
                    "bg-blue-500 animate-pulse",
                  run.conclusion === null &&
                    run.status !== "in_progress" &&
                    "bg-gray-400",
                )}
              />
              <a
                href={run.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {run.name}
              </a>
              <span className="text-gray-400 text-xs">({run.branch})</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {run.duration && <span>{formatDuration(run.duration)}</span>}
              <span>{formatRelativeTime(run.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommitsCard({ commits }: { commits: CommitInfo[] }) {
  if (commits.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="font-medium text-ink mb-3">Recent Commits</h3>
        <div className="text-sm text-gray-500">Loading commits...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <h3 className="font-medium text-ink mb-3">Recent Commits</h3>
      <div className="space-y-2">
        {commits.slice(0, 5).map((commit) => (
          <div key={commit.sha} className="flex items-start gap-2 text-sm">
            <a
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-600 hover:underline shrink-0"
            >
              {commit.shortSha}
            </a>
            <span className="text-gray-700 truncate">{commit.message}</span>
            <span className="text-xs text-gray-400 shrink-0">
              {formatRelativeTime(commit.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TelemetryDashboard() {
  const [services, setServices] = useState<ServiceStatus[]>(
    ENVIRONMENTS.map((e) => ({ ...e, status: "checking" as const })),
  );
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const checkServices = useCallback(async () => {
    const results = await Promise.all(
      ENVIRONMENTS.map(async (env) => {
        try {
          const res = await fetch(`/api/health/${env.env}`, {
            cache: "no-store",
          });

          if (!res.ok) {
            return {
              ...env,
              status: "error" as const,
              error: `HTTP ${res.status}`,
            };
          }

          const data: HealthProxyResponse = await res.json();

          if (data.status === "error") {
            return {
              ...env,
              status: "error" as const,
              latency: data.latency,
              error: data.error,
            };
          }

          return {
            ...env,
            status: "ok" as const,
            latency: data.latency,
            data: data.data,
          };
        } catch (err) {
          return {
            ...env,
            status: "error" as const,
            error: err instanceof Error ? err.message : "Unknown error",
          };
        }
      }),
    );

    setServices(results);
    setLastRefresh(new Date());
  }, []);

  const fetchGitHubData = useCallback(async () => {
    try {
      const [pipelineRes, actionsRes, commitsRes] = await Promise.allSettled([
        fetch("/api/pipeline").then((r) => r.json()),
        fetch("/api/github/actions").then((r) => r.json()),
        fetch("/api/github/commits").then((r) => r.json()),
      ]);

      if (pipelineRes.status === "fulfilled" && !pipelineRes.value.error) {
        setPipeline(pipelineRes.value);
      }

      if (actionsRes.status === "fulfilled" && actionsRes.value.runs) {
        setWorkflowRuns(actionsRes.value.runs);
      }

      if (commitsRes.status === "fulfilled" && commitsRes.value.commits) {
        setCommits(commitsRes.value.commits);
      }
    } catch {}
  }, []);

  useEffect(() => {
    checkServices();
    fetchGitHubData();
    const serviceInterval = setInterval(checkServices, 30000);
    const githubInterval = setInterval(fetchGitHubData, 60000);
    return () => {
      clearInterval(serviceInterval);
      clearInterval(githubInterval);
    };
  }, [checkServices, fetchGitHubData]);

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink">Villa Telemetry</h1>
            <p className="text-gray-500 text-sm">
              Infrastructure monitoring dashboard
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={() => {
                checkServices();
                fetchGitHubData();
              }}
              className="px-4 py-2 bg-ink text-cream rounded-lg hover:bg-ink/90 transition"
            >
              Refresh
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Last: {lastRefresh ? lastRefresh.toLocaleTimeString() : "—"}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <PipelineCard pipeline={pipeline} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {services.map((service) => (
            <ServiceCard key={service.name} service={service} />
          ))}
        </div>

        <BuildComparison services={services} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <WorkflowCard runs={workflowRuns} />
          <CommitsCard commits={commits} />
        </div>

        <div className="mt-6 bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
          <h3 className="font-medium text-ink mb-3">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <a
              href="https://github.com/rockfridrich/villa/actions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              GitHub Actions
            </a>
            <a
              href="https://cloud.digitalocean.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              DigitalOcean Apps
            </a>
            <a
              href="https://github.com/rockfridrich/villa/pulls"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Pull Requests
            </a>
            <a
              href="https://github.com/rockfridrich/villa/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Issues
            </a>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Telemetry Dashboard v0.2.0 | Auto-refreshes every 30s</p>
        </div>
      </div>
    </div>
  );
}
