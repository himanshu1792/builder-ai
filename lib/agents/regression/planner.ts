import { generateText, stepCountIs } from "ai";
import { getChatModel } from "@/lib/ai";
import { createVisiblePlaywrightMCP } from "./mcp-client-visible";
import type { RegressionPipelineContext } from "./pipeline";

/**
 * Regression Agent 1: Planner
 * Opens a visible Chromium browser (headless:false), explores the given URL,
 * auto-logs in with stored credentials, and generates a markdown test plan.
 * Narrates actions in real-time to the chat panel.
 */
export async function runPlanner(ctx: RegressionPipelineContext): Promise<string> {
  ctx.emit({
    event: "agent_message",
    data: { agent: "planner", text: "Launching visible Chromium browser..." },
  });

  const mcpClient = await createVisiblePlaywrightMCP();

  try {
    const tools = await mcpClient.tools();

    ctx.emit({
      event: "agent_message",
      data: {
        agent: "planner",
        text: `Browser ready. ${Object.keys(tools).length} tools available. Exploring ${ctx.targetUrl}...`,
      },
    });

    // Phase 1: AI-driven browser exploration with narration
    const explorationResult = await generateText({
      model: getChatModel(),
      tools,
      stopWhen: stepCountIs(30),
      system: `You are a senior QA test planner controlling a live Chromium browser through Playwright MCP tools. Your task is to thoroughly explore a web application page and discover all testable scenarios.

WORKFLOW:
1. Navigate to the target URL provided
2. If the application requires login, use the credentials below to authenticate first
3. Use browser_snapshot to understand page structure before each interaction
4. Systematically explore ALL interactive elements on the page:
   - Forms and inputs
   - Buttons and links
   - Dropdowns and menus
   - Modals and dialogs
   - Navigation elements
   - Data display areas (tables, lists, cards)
5. For each element, note what it does, what happens when you interact with it
6. Test edge cases: empty inputs, invalid data, boundary conditions
7. Note any loading states, error messages, or validation feedback

CREDENTIALS (use if login is required):
- Username: ${ctx.applicationUsername}
- Password: ${ctx.applicationPassword}

IMPORTANT:
- Always use browser_snapshot before interactions to get accurate element references
- Be thorough — explore every section of the page
- Note the exact selectors and text for each element you find
- Do NOT generate test code — just explore and understand the page
- After exploring, you'll generate a test plan in the next phase`,
      prompt: `Application: ${ctx.applicationName}
Target URL to explore: ${ctx.targetUrl}`,
      onStepFinish: ({ text, toolCalls }) => {
        if (text) {
          ctx.emit({
            event: "agent_message",
            data: { agent: "planner", text },
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
                agent: "planner",
                text: `\uD83D\uDD27 ${tc.toolName}(${inputStr})`,
              },
            });
          }
        }
      },
    });

    ctx.emit({
      event: "agent_message",
      data: {
        agent: "planner",
        text: `Exploration complete (${explorationResult.steps.length} steps). Generating test plan...`,
      },
    });

    // Phase 2: Generate markdown test plan from exploration
    const actionLog = explorationResult.steps
      .map((step, i) => {
        const parts: string[] = [];
        if (step.text) parts.push(`Thinking: ${step.text}`);
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

    const { text: testPlan } = await generateText({
      model: getChatModel(),
      system: `You are a QA test plan architect. Convert a browser exploration log into a comprehensive, structured markdown test plan.

FORMAT:
# Test Plan: [Page/Feature Name]

## Overview
Brief description of what was explored and the test coverage.

## Test Scenarios

### Scenario 1: [Descriptive Name]
**Objective:** What this test verifies
**Steps:**
1. Navigate to [URL]
2. [Specific action with exact element description]
3. [Specific action]
**Expected Results:**
- [Specific assertion 1]
- [Specific assertion 2]

### Scenario 2: [Descriptive Name]
...

## Edge Cases
- [Edge case 1]
- [Edge case 2]

REQUIREMENTS:
- Be specific about element selectors, text content, and expected values
- Include both positive and negative test scenarios
- Cover form validations, error states, and success states
- Each scenario must be self-contained and independently executable
- Include login/authentication steps where needed
- Reference actual URLs, button text, and field labels found during exploration
- Output ONLY the markdown plan, no code fences wrapping it`,
      prompt: `Application: ${ctx.applicationName}
Target URL: ${ctx.targetUrl}

Browser Exploration Log:
${actionLog}`,
    });

    return testPlan.replace(/^```(?:markdown)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  } finally {
    await mcpClient.close();
  }
}

/**
 * Regenerate test plan from existing exploration data (no re-browsing).
 * Used when user rejects the plan with feedback.
 */
export async function regeneratePlan(
  ctx: RegressionPipelineContext,
  previousPlan: string,
  feedback: string
): Promise<string> {
  ctx.emit({
    event: "agent_message",
    data: {
      agent: "planner",
      text: `Regenerating plan based on feedback: "${feedback}"`,
    },
  });

  const { text: revisedPlan } = await generateText({
    model: getChatModel(),
    system: `You are a QA test plan architect. Revise a test plan based on user feedback.

Maintain the same structured markdown format:
# Test Plan: [Page/Feature Name]
## Overview
## Test Scenarios
### Scenario N: [Name]
...
## Edge Cases

REQUIREMENTS:
- Incorporate the user's feedback into the revised plan
- Keep scenarios that weren't criticized
- Add, remove, or modify scenarios as the feedback requires
- Maintain specificity: exact URLs, element descriptions, expected values
- Output ONLY the markdown plan, no code fences wrapping it`,
    prompt: `PREVIOUS PLAN:
${previousPlan}

USER FEEDBACK:
${feedback}

APPLICATION: ${ctx.applicationName}
TARGET URL: ${ctx.targetUrl}

Generate a revised test plan incorporating the feedback.`,
  });

  return revisedPlan.replace(/^```(?:markdown)?\s*\n?/, "").replace(/\n?```\s*$/, "");
}
