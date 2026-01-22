import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface GHExecResult {
  stdout: string;
  stderr: string;
}

export async function ghExec(args: string): Promise<GHExecResult> {
  try {
    const result = await execAsync(`gh ${args}`, {
      timeout: 10000,
      maxBuffer: 1024 * 1024,
    });
    return result;
  } catch (error) {
    const err = error as Error & { stderr?: string; stdout?: string };
    throw new Error(`gh command failed: ${err.message}\n${err.stderr || ""}`);
  }
}

export async function ghApi<T>(
  endpoint: string,
  jqFilter?: string,
): Promise<T> {
  const jqArg = jqFilter ? ` --jq '${jqFilter}'` : "";
  const { stdout } = await ghExec(`api ${endpoint}${jqArg}`);
  return JSON.parse(stdout) as T;
}

export async function getWorkflowRuns(limit = 10): Promise<
  Array<{
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    head_branch: string;
    head_sha: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    run_started_at: string;
  }>
> {
  const { stdout } = await ghExec(
    `api repos/rockfridrich/villa/actions/runs --jq '.workflow_runs[:${limit}]'`,
  );
  return JSON.parse(stdout);
}

export async function getRecentCommits(limit = 10): Promise<
  Array<{
    sha: string;
    commit: {
      message: string;
      author: {
        name: string;
        date: string;
      };
    };
    html_url: string;
  }>
> {
  const { stdout } = await ghExec(
    `api repos/rockfridrich/villa/commits --jq '.[:${limit}]'`,
  );
  return JSON.parse(stdout);
}

export async function getDeploymentStatus(sha: string): Promise<{
  production: boolean;
  staging: boolean;
}> {
  try {
    const { stdout } = await ghExec(
      `api repos/rockfridrich/villa/deployments --jq '[.[] | select(.sha == "${sha}")]'`,
    );
    const deployments = JSON.parse(stdout);

    return {
      production: deployments.some(
        (d: { environment: string }) => d.environment === "production",
      ),
      staging: deployments.some(
        (d: { environment: string }) =>
          d.environment === "staging" || d.environment === "preview",
      ),
    };
  } catch {
    return { production: false, staging: false };
  }
}

export async function checkGhAuth(): Promise<{
  authenticated: boolean;
  user?: string;
  error?: string;
}> {
  try {
    const { stdout } = await ghExec("auth status --show-token 2>&1 || true");
    const isAuth = stdout.includes("Logged in to");
    const userMatch = stdout.match(/Logged in to github.com account (\S+)/);
    return {
      authenticated: isAuth,
      user: userMatch?.[1],
    };
  } catch (error) {
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface WorkflowJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string | null;
  steps: Array<{
    name: string;
    status: string;
    conclusion: string | null;
    number: number;
  }>;
}

export async function getLatestDeployRun(): Promise<{
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  head_sha: string;
  created_at: string;
  jobs: WorkflowJob[];
} | null> {
  try {
    const { stdout: runsOutput } = await ghExec(
      `api repos/rockfridrich/villa/actions/workflows/deploy.yml/runs --jq '.workflow_runs[0]'`,
    );
    const run = JSON.parse(runsOutput);
    if (!run?.id) return null;

    const { stdout: jobsOutput } = await ghExec(
      `api repos/rockfridrich/villa/actions/runs/${run.id}/jobs --jq '.jobs'`,
    );
    const jobs = JSON.parse(jobsOutput);

    return {
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      html_url: run.html_url,
      head_sha: run.head_sha,
      created_at: run.created_at,
      jobs,
    };
  } catch {
    return null;
  }
}
