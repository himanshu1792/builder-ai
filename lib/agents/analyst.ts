import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";
import type { PipelineContext } from "./pipeline";

export interface AnalystResult {
  originalInput: string;
  clarifications: Array<{ question: string; answer: string }>;
}

/**
 * Agent 1: Analyst
 * Uses AI to analyze the scenario and ask clarifying questions.
 * Returns the original input plus any Q&A gathered.
 */
export async function runAnalyst(ctx: PipelineContext): Promise<AnalystResult> {
  const clarifications: Array<{ question: string; answer: string }> = [];

  ctx.emit({
    event: "agent_message",
    data: {
      agent: "analyst",
      text: `Analyzing scenario for ${ctx.applicationName}...`,
    },
  });

  const { text } = await generateText({
    model: getChatModel(),
    system: `You are a QA analyst. Analyze the following test scenario for a web application and identify any ambiguities or missing details that would prevent generating a complete Playwright test script.

Output a JSON array of 0-3 clarifying questions. Each question object has:
- "text": the question string
- "type": "text" (free-form answer) or "choice" (multiple choice)
- "choices": array of 2-4 strings (required when type is "choice", omit for "text")

If the scenario is clear and complete, return an empty array [].
Output ONLY valid JSON, no markdown fencing or explanation.`,
    prompt: `Application: ${ctx.applicationName}
URL: ${ctx.applicationUrl}

Scenario:
${ctx.inputText}`,
  });

  let questions: Array<{ text: string; type: string; choices?: string[] }> = [];
  try {
    questions = JSON.parse(text);
    if (!Array.isArray(questions)) questions = [];
  } catch {
    // AI returned malformed JSON — proceed with no questions
    ctx.emit({
      event: "agent_message",
      data: { agent: "analyst", text: "Scenario is clear. No clarifying questions needed." },
    });
  }

  for (const q of questions) {
    const choices = q.type === "choice" && q.choices ? q.choices : undefined;
    const answer = await ctx.askQuestion("analyst", q.text, choices);
    clarifications.push({ question: q.text, answer });
    ctx.emit({
      event: "agent_message",
      data: { agent: "analyst", text: `Got it — "${answer}". Moving on.` },
    });
  }

  if (questions.length === 0 && clarifications.length === 0) {
    ctx.emit({
      event: "agent_message",
      data: { agent: "analyst", text: "Scenario is clear. No clarifying questions needed." },
    });
  }

  ctx.emit({
    event: "agent_message",
    data: { agent: "analyst", text: "Analysis complete. Handing off to Prompt Builder." },
  });

  return {
    originalInput: ctx.inputText,
    clarifications,
  };
}
