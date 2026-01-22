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

interface ServiceStatus {
  name: string;
  url: string;
  status: "checking" | "ok" | "error";
  latency?: number;
  data?: HealthData;
  error?: string;
}

const SERVICES = [
  { name: "Local Hub", url: "http://localhost:3000/api/health" },
  { name: "Staging", url: "https://beta.villa.cash/api/health" },
  { name: "Production", url: "https://villa.cash/api/health" },
  { name: "Developers", url: "https://developers.villa.cash" },
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

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
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
              Built: {new Date(build.time).toLocaleString()}
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

export default function TelemetryDashboard() {
  const [services, setServices] = useState<ServiceStatus[]>(
    SERVICES.map((s) => ({ ...s, status: "checking" as const })),
  );
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const checkServices = useCallback(async () => {
    const results = await Promise.all(
      SERVICES.map(async (service) => {
        const start = Date.now();
        try {
          const res = await fetch(service.url, {
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const contentType = res.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const data = await res.json();
            return {
              ...service,
              status: "ok" as const,
              latency: Date.now() - start,
              data,
            };
          }

          return {
            ...service,
            status: "ok" as const,
            latency: Date.now() - start,
            data: {
              status: "ok",
              timestamp: new Date().toISOString(),
              version: "static",
            },
          };
        } catch (err) {
          return {
            ...service,
            status: "error" as const,
            error: err instanceof Error ? err.message : "Unknown error",
          };
        }
      }),
    );

    setServices(results);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 30000);
    return () => clearInterval(interval);
  }, [checkServices]);

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink">Villa Telemetry</h1>
            <p className="text-gray-500 text-sm">
              Infrastructure monitoring dashboard
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={checkServices}
              className="px-4 py-2 bg-ink text-cream rounded-lg hover:bg-ink/90 transition"
            >
              Refresh
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Last: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {services.map((service) => (
            <ServiceCard key={service.name} service={service} />
          ))}
        </div>

        <BuildComparison services={services} />

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
          <p>Telemetry Dashboard v0.1.0 | Auto-refreshes every 30s</p>
        </div>
      </div>
    </div>
  );
}
