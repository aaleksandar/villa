#!/usr/bin/env bun
/**
 * TypeDoc API Generation Script
 *
 * Generates API documentation from TypeScript source using TypeDoc.
 * Outputs both JSON and Markdown for consumption by developers app.
 *
 * Usage: bun scripts/docs/generate-api-docs.ts
 *
 * Prerequisites: bun add -d typedoc typedoc-plugin-markdown
 */

import { spawn } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT_DIR = join(new URL(".", import.meta.url).pathname, "../..");
const DOCS_DIR = join(ROOT_DIR, "docs/api");
const TYPEDOC_CONFIG = join(ROOT_DIR, "typedoc.json");

interface ApiDocResult {
  success: boolean;
  outputDir: string;
  jsonFile?: string;
  error?: string;
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function runTypedoc(): Promise<ApiDocResult> {
  ensureDir(DOCS_DIR);

  return new Promise((resolve) => {
    const proc = spawn("bunx", ["typedoc", "--options", TYPEDOC_CONFIG], {
      cwd: ROOT_DIR,
      stdio: ["inherit", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({
          success: true,
          outputDir: DOCS_DIR,
          jsonFile: join(DOCS_DIR, "api.json"),
        });
      } else {
        resolve({
          success: false,
          outputDir: DOCS_DIR,
          error: stderr || stdout || `TypeDoc exited with code ${code}`,
        });
      }
    });

    proc.on("error", (err) => {
      resolve({
        success: false,
        outputDir: DOCS_DIR,
        error: err.message,
      });
    });
  });
}

function generateGitignore(): void {
  const gitignorePath = join(DOCS_DIR, ".gitignore");
  const content = `# Generated API documentation - do not commit
*
!.gitignore
`;
  writeFileSync(gitignorePath, content);
}

const KIND_MAP: Record<number, string> = {
  1: "project",
  2: "module",
  4: "namespace",
  8: "enum",
  16: "enum-member",
  32: "variable",
  64: "function",
  128: "class",
  256: "interface",
  512: "constructor",
  1024: "property",
  2048: "method",
  4096: "call-signature",
  8192: "index-signature",
  16384: "constructor-signature",
  32768: "parameter",
  65536: "type-literal",
  131072: "type-parameter",
  262144: "accessor",
  524288: "get-signature",
  1048576: "set-signature",
  2097152: "type-alias",
  4194304: "reference",
};

function transformForDevelopersApp(): void {
  const jsonPath = join(DOCS_DIR, "api.json");
  if (!existsSync(jsonPath)) {
    console.log("  Skipping transform: api.json not found");
    return;
  }

  const apiJson = JSON.parse(readFileSync(jsonPath, "utf-8"));

  interface TransformedDoc {
    name: string;
    kind: string;
    description?: string;
    signature?: string;
    parameters?: Array<{ name: string; type: string; description?: string }>;
    returns?: string;
    module?: string;
  }

  const simplified: TransformedDoc[] = [];

  function extractDocs(
    node: Record<string, unknown>,
    depth = 0,
    moduleName = "",
  ): void {
    if (depth > 10) return;

    const name = node.name as string | undefined;
    const kind = node.kind as number | undefined;
    const kindName = kind ? KIND_MAP[kind] : undefined;
    const comment = node.comment as Record<string, unknown> | undefined;
    const signatures = node.signatures as
      | Array<Record<string, unknown>>
      | undefined;

    const currentModule = kind === 2 ? name || moduleName : moduleName;

    if (name && kindName && !name.startsWith("_") && ![1, 2].includes(kind!)) {
      const doc: TransformedDoc = {
        name,
        kind: kindName,
        module: currentModule,
      };

      if (comment) {
        const summary = comment.summary as
          | Array<{ kind: string; text: string }>
          | undefined;
        if (summary) {
          doc.description = summary.map((s) => s.text).join("");
        }
      }

      if (signatures && signatures[0]) {
        const sig = signatures[0];
        const sigComment = sig.comment as Record<string, unknown> | undefined;
        if (sigComment) {
          const summary = sigComment.summary as
            | Array<{ kind: string; text: string }>
            | undefined;
          if (summary) {
            doc.description = summary.map((s) => s.text).join("");
          }
        }

        const params = sig.parameters as
          | Array<Record<string, unknown>>
          | undefined;
        if (params) {
          doc.parameters = params.map((p) => ({
            name: p.name as string,
            type:
              ((p.type as Record<string, unknown>)?.name as string) ||
              "unknown",
            description: (
              (p.comment as Record<string, unknown>)?.summary as Array<{
                kind: string;
                text: string;
              }>
            )
              ?.map((s) => s.text)
              .join(""),
          }));
        }
      }

      simplified.push(doc);
    }

    const children = node.children as
      | Array<Record<string, unknown>>
      | undefined;
    if (children) {
      for (const child of children) {
        extractDocs(child, depth + 1, currentModule);
      }
    }
  }

  extractDocs(apiJson);

  const simplifiedPath = join(DOCS_DIR, "api-simplified.json");
  writeFileSync(simplifiedPath, JSON.stringify(simplified, null, 2));
  console.log(`  Generated: ${simplifiedPath} (${simplified.length} entries)`);
}

async function main(): Promise<void> {
  console.log("Generating API documentation...");

  if (!existsSync(TYPEDOC_CONFIG)) {
    console.error(`Error: TypeDoc config not found at ${TYPEDOC_CONFIG}`);
    process.exit(1);
  }

  const result = await runTypedoc();

  if (!result.success) {
    console.error(`TypeDoc failed: ${result.error}`);
    process.exit(1);
  }

  console.log("\nPost-processing...");
  generateGitignore();
  transformForDevelopersApp();

  console.log(`\n✓ API docs generated at: ${result.outputDir}`);
  if (result.jsonFile) {
    console.log(`  JSON: ${result.jsonFile}`);
  }
}

main();
