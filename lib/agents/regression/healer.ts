import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";
import { writeFile, unlink, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { RegressionPipelineContext } from "./pipeline";

const execFileAsync = promisify(execFile);
const MAX_RETRIES = 3;

interface RunResult {
  passed: boolean;
  stdout: string;
  stderr: string;
}

/**
 * Execute a Playwright test script in headless mode.
 */
async function executeScript(
  scriptContent: string,
  username: string,
  password: string
): Promise<RunResult> {
  const tempDir = await mkdtemp(join(tmpdir(), "testforge-regression-"));
  const scriptPath = join(tempDir, "test.spec.ts");

  try {
    await writeFile(scriptPath, scriptContent, "utf-8");

    const result = await execFileAsync(
      "npx",
      [
        "playwright",
        "test",
        scriptPath,
        "--reporter=line",
        "--timeout=30000",
      ],
      {
        timeout: 90_000,
        env: {
          ...process.env,
          TEST_USERNAME: username,
          TEST_PASSWORD: password,
        },
      }
    ).catch((error: { stdout?: string; stderr?: string; message?: string }) => ({
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? error.message ?? "",
    }));

    const output = `${result.stdout}\n${result.stderr}`;
    const passed =
      !output.includes("failed") &&
      !output.includes("Error") &&
      !output.includes("FAIL");

    return {
      passed,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  } finally {
    await unlink(scriptPath).catch(() => {});
  }
}

/**
 * Regression Agent 3: Healer
 * Runs the generated script in headless Chromium, captures errors,
 * and uses AI to diagnose + auto-fix. Retries up to MAX_RETRIES times.
 */
export async function runHealer(
  ctx: RegressionPipelineContext,
  script: string
): Promise<string> {
  ctx.emit({
    event: "agent_message",
    data: { agent: "healer", text: "Running generated tests in headless mode..." },
  });

  let currentScript = script;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    ctx.emit({
      event: "agent_message",
      data: {
        agent: "healer",
        text:
          attempt === 1
            ? "Executing test script..."
            : `Re-running script (attempt ${attempt}/${MAX_RETRIES})...`,
      },
    });

    const result = await executeScript(
      currentScript,
      ctx.applicationUsername,
      ctx.applicationPassword
    );

    if (result.passed) {
      ctx.emit({
        event: "agent_message",
        data: {
          agent: "healer",
          text: "All tests passed. Script is healthy.",
        },
      });
      return currentScript;
    }

    ctx.emit({
      event: "agent_message",
      data: {
        agent: "healer",
        text: `Tests failed (attempt ${attempt}). Analyzing errors and healing...`,
      },
    });

    const errorOutput = [
      "STDOUT:",
      result.stdout.slice(0, 2000),
      "",
      "STDERR:",
      result.stderr.slice(0, 2000),
    ].join("\n");

    ctx.emit({
      event: "agent_message",
      data: {
        agent: "healer",
        text: `Error: ${result.stderr.slice(0, 200)}`,
      },
    });

    const { text: fixedScript } = await generateText({
      model: getChatModel(),
      system: `You are a Playwright test debugging expert (Healer agent). Analyze the test script and its error output, then produce a corrected version of the entire script.

RULES:
- Fix the specific errors shown in the output
- Common fixes: wrong selectors, missing waits, incorrect assertions, timeout issues
- Keep the overall test structure intact
- Use more robust selectors if the current ones fail (data-testid, aria-label, role)
- Add waitForSelector or waitForLoadState if there are timing issues
- Ensure credentials use process.env.TEST_USERNAME and process.env.TEST_PASSWORD
- Output ONLY the corrected script — no explanations, no markdown fencing`,
      prompt: `CURRENT SCRIPT:
${currentScript}

ERROR OUTPUT:
${errorOutput}

APPLICATION URL: ${ctx.targetUrl}

Fix this script and return the corrected version.`,
    });

    ctx.emit({
      event: "agent_message",
      data: {
        agent: "healer",
        text: "Applied fixes. Re-running to verify...",
      },
    });

    // Strip markdown code fences that the AI may add despite instructions
    currentScript = fixedScript.replace(/^```(?:typescript|ts|javascript|js)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  throw new Error(
    `Script failed healing after ${MAX_RETRIES} attempts. Manual intervention required.`
  );
}
