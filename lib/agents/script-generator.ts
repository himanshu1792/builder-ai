import { generateText, stepCountIs } from "ai";
import { getChatModel } from "@/lib/ai";
import { getPlaywrightMCP } from "./mcp-client";
import type { PipelineContext } from "./pipeline";

/**
 * Agent 3: Script Generator
 * Uses Playwright MCP to drive a live Chromium browser, then converts
 * the recorded exploration into a production-ready Playwright test script.
 *
 * Two-phase approach:
 *   Phase 1 — AI-driven browser exploration (tool calls via MCP)
 *   Phase 2 — Script generation from the action log
 */
export async function runScriptGenerator(
  ctx: PipelineContext,
  refinedPrompt: string
): Promise<string> {
  ctx.emit({
    event: "agent_message",
    data: {
      agent: "script_generator",
      text: "Launching Chromium browser via Playwright MCP...",
    },
  });

  // Get persistent MCP client and its tools
  const mcpClient = await getPlaywrightMCP();
  const tools = await mcpClient.tools();

  ctx.emit({
    event: "agent_message",
    data: {
      agent: "script_generator",
      text: `Browser ready. ${Object.keys(tools).length} tools available. Starting exploration...`,
    },
  });

  // ── Phase 1: AI-driven browser exploration ──
  const explorationResult = await generateText({
    model: getChatModel(),
    tools,
    stopWhen: stepCountIs(25),
    system: `You are a senior QA automation engineer controlling a live Chromium browser through Playwright MCP tools. Your task is to execute a test scenario step-by-step on a real web application.

WORKFLOW:
1. Navigate to the application URL
2. Use browser_snapshot to understand the page structure before each interaction
3. If login is required, use the credentials provided below
4. Follow each step in the test scenario exactly
5. After each action, verify the result (check page changed, elements appeared, etc.)
6. Use browser_click, browser_type, browser_fill_form for interactions
7. Use browser_snapshot or browser_take_screenshot to verify results

CREDENTIALS (use if login is required):
- Username: ${ctx.applicationUsername}
- Password: ${ctx.applicationPassword}

IMPORTANT:
- Always use browser_snapshot before clicking or typing to get accurate element references
- Be methodical — one action at a time, verify after each step
- If an element is not found, try browser_snapshot again or wait
- Do NOT generate code — just interact with the browser using the available tools`,
    prompt: `Application: ${ctx.applicationName}
URL: ${ctx.applicationUrl}

Test Scenario (follow these steps):
${refinedPrompt}`,
    onStepFinish: ({ text, toolCalls }) => {
      // Emit real-time progress to the agent chat panel
      if (text) {
        ctx.emit({
          event: "agent_message",
          data: { agent: "script_generator", text },
        });
      }
      if (toolCalls) {
        for (const tc of toolCalls) {
          const inputStr = JSON.stringify(
            "input" in tc ? tc.input : {},
            null,
            0
          ).slice(0, 200);
          ctx.emit({
            event: "agent_message",
            data: {
              agent: "script_generator",
              text: `🔧 ${tc.toolName}(${inputStr})`,
            },
          });
        }
      }
    },
  });

  ctx.emit({
    event: "agent_message",
    data: {
      agent: "script_generator",
      text: `Exploration complete (${explorationResult.steps.length} steps). Generating test script...`,
    },
  });

  // ── Phase 2: Convert exploration log into a Playwright script ──
  // Build action log from tool calls and their results
  const actionLog = explorationResult.steps
    .map((step, i) => {
      const parts: string[] = [];
      if (step.text) parts.push(`Thinking: ${step.text}`);

      // Map tool calls with their results from toolResults
      if (step.toolCalls && step.toolResults) {
        for (let j = 0; j < step.toolCalls.length; j++) {
          const tc = step.toolCalls[j];
          const tr = step.toolResults[j];
          const inputStr = JSON.stringify("input" in tc ? tc.input : {});
          const outputStr = JSON.stringify(
            tr && "output" in tr ? tr.output : "no result"
          ).slice(0, 500);
          parts.push(`Tool: ${tc.toolName}(${inputStr}) => ${outputStr}`);
        }
      }
      return `Step ${i + 1}:\n${parts.join("\n")}`;
    })
    .join("\n\n");

  const { text: script } = await generateText({
    model: getChatModel(),
    system: `You are a Playwright test script generator. Convert a browser exploration log into a clean, production-ready Playwright test file.

REQUIREMENTS:
- Use import syntax: import { test, expect } from '@playwright/test';
- Use TypeScript/ESM syntax throughout
- Use robust selectors: prefer data-testid, id, aria-label, role over fragile CSS paths
- Include meaningful expect() assertions at key verification points
- Add appropriate waits: waitForSelector, waitForLoadState, waitForURL where needed
- Handle login if the exploration shows authentication steps
- DO NOT hardcode credentials — use environment variables:
  process.env.TEST_USERNAME and process.env.TEST_PASSWORD
- Include a descriptive test.describe block and test name
- Output ONLY the script content, no markdown fencing, no explanations
- Make the script idempotent and repeatable`,
    prompt: `Application: ${ctx.applicationName}
URL: ${ctx.applicationUrl}
Test scenario: ${ctx.inputText}

Browser Exploration Log:
${actionLog}`,
  });

  ctx.emit({
    event: "agent_message",
    data: {
      agent: "script_generator",
      text: "Test script generated successfully.",
    },
  });

  return script;
}
