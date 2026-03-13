import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";
import type { PipelineContext } from "./pipeline";
import type { AnalystResult } from "./analyst";

/**
 * Agent 2: Prompt Builder
 * Uses AI to generate a structured testing prompt from scenario + analyst answers.
 * User must accept the prompt; rejections loop with AI regeneration.
 */
export async function runPromptBuilder(
  ctx: PipelineContext,
  analystResult: AnalystResult
): Promise<string> {
  ctx.emit({
    event: "agent_message",
    data: { agent: "prompt_builder", text: "Building structured test prompt..." },
  });

  let rejectionReason: string | undefined;

  // Prompt approval loop
  while (true) {
    const prompt = await buildPromptWithAI(ctx, analystResult, rejectionReason);

    if (rejectionReason) {
      ctx.emit({
        event: "agent_message",
        data: {
          agent: "prompt_builder",
          text: `Prompt regenerated based on your feedback. Please review.`,
        },
      });
    }

    const result = await ctx.requestPromptApproval(prompt);

    if (result.accepted) {
      ctx.emit({
        event: "agent_message",
        data: { agent: "prompt_builder", text: "Prompt accepted. Proceeding to script generation." },
      });
      return prompt;
    }

    rejectionReason = result.reason;
    ctx.emit({
      event: "agent_message",
      data: {
        agent: "prompt_builder",
        text: `Regenerating prompt based on your feedback: "${rejectionReason}"`,
      },
    });
  }
}

async function buildPromptWithAI(
  ctx: PipelineContext,
  analystResult: AnalystResult,
  rejectionFeedback?: string
): Promise<string> {
  const clarificationBlock =
    analystResult.clarifications.length > 0
      ? analystResult.clarifications
          .map((c) => `Q: ${c.question}\nA: ${c.answer}`)
          .join("\n\n")
      : "No clarifications were needed.";

  const feedbackBlock = rejectionFeedback
    ? `\n\nThe user rejected the previous prompt with this feedback:\n"${rejectionFeedback}"\nIncorporate this feedback into the new prompt.`
    : "";

  const { text } = await generateText({
    model: getChatModel(),
    system: `You are a test prompt engineer. Generate a detailed, structured testing prompt that will guide an AI agent to generate a Playwright test script.

The prompt must include:
1. Clear step-by-step test instructions (numbered)
2. Expected assertions at each step (what to verify)
3. Login/authentication steps if the application requires credentials
4. Element interaction specifics (what to click, fill, verify)
5. Edge cases or negative checks relevant to the scenario

Format the output as a clean Markdown document with numbered steps.
Do NOT include any code — only human-readable instructions for the test generation agent.
Be specific about what pages to visit, what elements to interact with, and what outcomes to verify.

IMPORTANT: The application URL is provided below. Always use EXACTLY this URL as the starting point for navigation. Do NOT use placeholder URLs like "https://example.com" or any other generic URL. The very first step must navigate directly to the provided application URL or a relevant path under it.`,
    prompt: `Application: ${ctx.applicationName}
Application URL (use this exact URL, do NOT substitute with example.com or any placeholder): ${ctx.applicationUrl}

Original Scenario:
${analystResult.originalInput}

Clarifications:
${clarificationBlock}
${feedbackBlock}`,
  });

  // Strip markdown code fences the AI sometimes wraps the output in
  return text.replace(/^```(?:markdown)?\s*\n?/, "").replace(/\n?```\s*$/, "");
}
