"use client";

import { useState, useCallback, useRef } from "react";
import type { ApplicationListItem } from "@/lib/applications";
import type { GroupedRepositories } from "@/lib/scenarios";
import { SmokeTestForm } from "./SmokeTestForm";
import { AgentChatPanel, type ChatMessage } from "./AgentChatPanel";
import { AgentPipelineBar, type AgentStep } from "./AgentPipelineBar";

interface SmokeTestClientProps {
  applications: ApplicationListItem[];
  repositoriesByApp: GroupedRepositories;
}

type PipelineState = "idle" | "running" | "awaiting_answer" | "awaiting_prompt_approval" | "completed" | "failed";

const AGENT_ORDER = ["analyst", "prompt_builder", "script_generator", "reviewer", "pr_creator"];

export function SmokeTestClient({ applications, repositoriesByApp }: SmokeTestClientProps) {
  const [pipelineState, setPipelineState] = useState<PipelineState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [steps, setSteps] = useState<AgentStep[]>(
    AGENT_ORDER.map((id) => ({
      id,
      label: formatAgentLabel(id),
      status: "pending" as const,
    }))
  );
  const [pendingQuestion, setPendingQuestion] = useState<Extract<ChatMessage, { type: "question" }> | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);

  // Ref to hold the answer resolver for SSE interaction
  const answerResolverRef = useRef<((answer: string) => void) | null>(null);
  const promptResolverRef = useRef<((accepted: boolean, reason?: string) => void) | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateStep = useCallback((agentId: string, status: AgentStep["status"]) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === agentId ? { ...s, status } : s))
    );
  }, []);

  // --- Pipeline Execution via SSE ---
  const startPipeline = useCallback(
    async (data: { inputText: string; applicationId: string; repositoryId: string }) => {
      setPipelineState("running");
      setMessages([]);
      setPrUrl(null);
      setPendingQuestion(null);
      setPendingPrompt(null);
      setSteps(AGENT_ORDER.map((id) => ({ id, label: formatAgentLabel(id), status: "pending" as const })));

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        // Create the scenario first
        const createRes = await fetch("/api/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          signal: abort.signal,
        });

        if (!createRes.ok) {
          const err = await createRes.json();
          throw new Error(err.message || "Failed to create scenario");
        }

        const { id } = await createRes.json();
        setScenarioId(id);

        // Start SSE stream
        const eventSource = new EventSource(`/api/runs/${id}/stream`);

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleSSEEvent(data);
        };

        eventSource.addEventListener("agent_start", (event) => {
          const data = JSON.parse(event.data);
          updateStep(data.agent, "active");
          addMessage({ type: "status", agent: data.agent, text: `${formatAgentLabel(data.agent)} started...` });
        });

        eventSource.addEventListener("agent_complete", (event) => {
          const data = JSON.parse(event.data);
          updateStep(data.agent, "complete");
        });

        eventSource.addEventListener("agent_message", (event) => {
          const data = JSON.parse(event.data);
          addMessage({ type: "agent", agent: data.agent, text: data.text });
        });

        eventSource.addEventListener("question", (event) => {
          const data = JSON.parse(event.data);
          const q: Extract<ChatMessage, { type: "question" }> = {
            type: "question",
            agent: data.agent,
            text: data.text,
            questionType: data.choices ? "choices" : "text",
            choices: data.choices,
          };
          setPendingQuestion(q);
          setPipelineState("awaiting_answer");
        });

        eventSource.addEventListener("prompt_review", (event) => {
          const data = JSON.parse(event.data);
          setPendingPrompt(data.prompt);
          setPipelineState("awaiting_prompt_approval");
        });

        eventSource.addEventListener("script", (event) => {
          const data = JSON.parse(event.data);
          addMessage({ type: "script", code: data.code });
        });

        eventSource.addEventListener("pr_created", (event) => {
          const data = JSON.parse(event.data);
          setPrUrl(data.url);
          addMessage({ type: "pr_link", url: data.url });
          updateStep("pr_creator", "complete");
          setPipelineState("completed");
        });

        eventSource.addEventListener("error_event", (event) => {
          const data = JSON.parse(event.data);
          addMessage({ type: "error", text: data.message });
          updateStep(data.agent || "analyst", "failed");
          setPipelineState("failed");
          eventSource.close();
        });

        eventSource.addEventListener("done", () => {
          if (pipelineState !== "completed" && pipelineState !== "failed") {
            setPipelineState("completed");
          }
          eventSource.close();
        });

        eventSource.onerror = () => {
          eventSource.close();
          if (pipelineState === "running") {
            addMessage({ type: "error", text: "Connection to agent pipeline lost." });
            setPipelineState("failed");
          }
        };
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          addMessage({ type: "error", text: error.message });
          setPipelineState("failed");
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function handleSSEEvent(data: Record<string, unknown>) {
    // Generic message handler for untyped events
    if (data.type === "message") {
      addMessage({ type: "agent", agent: data.agent as string, text: data.text as string });
    }
  }

  // --- User Interaction Handlers ---

  const handleAnswer = useCallback(
    async (answer: string) => {
      addMessage({ type: "user", text: answer });
      setPendingQuestion(null);
      setPipelineState("running");

      if (scenarioId) {
        await fetch(`/api/runs/${scenarioId}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "answer", answer }),
        });
      }
    },
    [scenarioId, addMessage]
  );

  const handleAcceptPrompt = useCallback(async () => {
    if (pendingPrompt) {
      addMessage({ type: "prompt", text: pendingPrompt });
    }
    setPendingPrompt(null);
    setPipelineState("running");

    if (scenarioId) {
      await fetch(`/api/runs/${scenarioId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "accept_prompt" }),
      });
    }
  }, [scenarioId, pendingPrompt, addMessage]);

  const handleRejectPrompt = useCallback(
    async (reason: string) => {
      addMessage({ type: "user", text: `Rejected: ${reason}` });
      setPendingPrompt(null);
      setPipelineState("running");

      if (scenarioId) {
        await fetch(`/api/runs/${scenarioId}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "reject_prompt", reason }),
        });
      }
    },
    [scenarioId, addMessage]
  );

  const handleRetry = useCallback(() => {
    setPipelineState("idle");
    setMessages([]);
    setPrUrl(null);
    setSteps(AGENT_ORDER.map((id) => ({ id, label: formatAgentLabel(id), status: "pending" as const })));
  }, []);

  const isFormDisabled = pipelineState !== "idle" && pipelineState !== "completed" && pipelineState !== "failed";

  return (
    <div className="space-y-4">
      {/* Agent Pipeline Bar — directly under page header */}
      <AgentPipelineBar steps={steps} prUrl={prUrl} />

      {/* Two-column layout: Scenario + Agent Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left — Scenario Form */}
        <div className="lg:col-span-1">
          <SmokeTestForm
            applications={applications}
            repositoriesByApp={repositoriesByApp}
            onSubmit={startPipeline}
            disabled={isFormDisabled}
          />
        </div>

        {/* Right — Agent Activity */}
        <div className="lg:col-span-2">
          <div className="h-[540px]">
            <AgentChatPanel
              messages={messages}
              pendingQuestion={pendingQuestion}
              pendingPrompt={pendingPrompt}
              onAnswer={handleAnswer}
              onAcceptPrompt={handleAcceptPrompt}
              onRejectPrompt={handleRejectPrompt}
              onRetry={handleRetry}
              isRunning={pipelineState === "running"}
            />
          </div>
        </div>
      </div>

      {/* Retry / New Run button */}
      {(pipelineState === "completed" || pipelineState === "failed") && (
        <div className="flex justify-center">
          <button
            onClick={handleRetry}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-dim"
          >
            {pipelineState === "failed" ? "Try Again" : "New Test Run"}
          </button>
        </div>
      )}
    </div>
  );
}

function formatAgentLabel(id: string): string {
  return id
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
