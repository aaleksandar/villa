export interface HealthData {
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

export interface HealthProxyResponse {
  environment: string;
  url: string;
  status: "ok" | "error";
  latency: number;
  data?: HealthData;
  error?: string;
  fetchedAt: string;
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  sha: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  duration?: number;
}

export interface GitHubActionsResponse {
  runs: WorkflowRun[];
  total: number;
  fetchedAt: string;
}

export interface CommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  deployStatus?: {
    production: "deployed" | "pending" | "unknown";
    staging: "deployed" | "pending" | "unknown";
  };
}

export interface GitHubCommitsResponse {
  commits: CommitInfo[];
  fetchedAt: string;
}

export interface PipelineStage {
  name: string;
  status: "success" | "running" | "failed" | "pending";
  duration?: number;
  url?: string;
  details?: string;
}

export interface PipelineResponse {
  stages: PipelineStage[];
  lastCommit: CommitInfo | null;
  lastDeploy: {
    production: string | null;
    staging: string | null;
  };
  fetchedAt: string;
}

export type Environment = "local" | "staging" | "production" | "developers";

export const ENVIRONMENT_URLS: Record<Environment, string> = {
  local: "http://localhost:3000/api/health",
  staging: "https://beta.villa.cash/api/health",
  production: "https://villa.cash/api/health",
  developers: "https://developers.villa.cash",
};
