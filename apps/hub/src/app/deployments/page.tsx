"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface DeploymentStatus {
  status: string;
  version: string;
  environment: string;
  build: {
    id: string;
    sha: string;
    time: string;
  };
  uptime: string;
  timestamp: string;
}

interface Environment {
  name: string;
  url: string;
  domain: string;
}

const environments: Environment[] = [
  { name: "Production", url: "https://villa.cash", domain: "villa.cash" },
  {
    name: "Staging",
    url: "https://beta.villa.cash",
    domain: "beta.villa.cash",
  },
];

function StatusBadge({ status }: { status: string }) {
  const isOk = status === "ok";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isOk ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {isOk ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5" />
      )}
      {isOk ? "Healthy" : "Down"}
    </span>
  );
}

function EnvironmentCard({ env }: { env: Environment }) {
  const [data, setData] = useState<DeploymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${env.url}/api/status`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [env.url]);

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">{env.name}</h2>
          <a
            href={env.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-muted hover:text-accent-brown flex items-center gap-1"
          >
            {env.domain}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-cream-100 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 text-ink-muted ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      ) : loading && !data ? (
        <div className="flex items-center gap-2 text-ink-muted text-sm">
          <Clock className="w-4 h-4 animate-pulse" />
          Loading...
        </div>
      ) : data ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={data.status} />
            <span className="text-sm font-medium text-ink">
              v{data.version}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-ink-muted">Commit</p>
              <p className="font-mono text-ink">{data.build.sha}</p>
            </div>
            <div>
              <p className="text-ink-muted">Build ID</p>
              <p className="font-mono text-ink truncate">
                {data.build.id.slice(0, 12)}
              </p>
            </div>
            <div>
              <p className="text-ink-muted">Deployed</p>
              <p className="text-ink">{formatTime(data.build.time)}</p>
            </div>
            <div>
              <p className="text-ink-muted">Uptime</p>
              <p className="text-ink">{data.uptime}</p>
            </div>
          </div>

          <p className="text-xs text-ink-muted">
            Last checked: {formatTime(data.timestamp)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function DeploymentsPage() {
  return (
    <main className="min-h-screen bg-cream-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-ink mb-2">Deployments</h1>
          <p className="text-ink-muted">
            Live status of Villa environments. Auto-refreshes every 30 seconds.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {environments.map((env) => (
            <EnvironmentCard key={env.name} env={env} />
          ))}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">Quick Links</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <a
              href="https://github.com/rockfridrich/villa/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-cream-50 hover:bg-cream-100 transition-colors"
            >
              <span className="text-ink">GitHub Releases</span>
              <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
            </a>
            <a
              href="https://github.com/rockfridrich/villa/actions/workflows/deploy.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-cream-50 hover:bg-cream-100 transition-colors"
            >
              <span className="text-ink">Deploy Workflow</span>
              <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
            </a>
            <a
              href="https://villa.cash/api/status"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-cream-50 hover:bg-cream-100 transition-colors"
            >
              <span className="text-ink">Status API</span>
              <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
