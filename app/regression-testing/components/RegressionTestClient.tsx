"use client";

import { useState, useCallback, useRef } from "react";
import type { ApplicationListItem } from "@/lib/applications";
import type { GroupedRepositories } from "@/lib/scenarios";
import { RegressionTestForm } from "./RegressionTestForm";
import { AgentChatPanel, type ChatMessage } from "@/app/smoke-testing/components/AgentChatPanel";
import { AgentPipelineBar, type AgentStep } from "@/app/smoke-testing/components/AgentPipelineBar";

interface RegressionTestClientProps {
  applications: ApplicationListItem[];
  repositoriesByApp: GroupedRepositories;
}

type PipelineState = "idle" | "running" | "awaiting_plan_approval" | "completed" | "failed";

const AGENT_ORDER = ["planner", "generator", "healer"];

export function RegressionTestClient({ applications, repositoriesByApp }: RegressionTestClientProps) {
  const [pipelineState, setPipelineState] = useState<PipelineState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [steps, setSteps] = useState<AgentStep[]>(
    AGENT_ORDER.map((id) => ({
      id,
      label: formatAgentLabel(id),
      status: "pending" as const,
    }))
  );
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);

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
    async (data: { targetUrl: string; applicationId: string; repositoryId: string }) => {
      setPipelineState("running");
      setMessages([]);
      setPrUrl(null);
      setPendingPlan(null);
      setSteps(AGENT_ORDER.map((id) => ({ id, label: formatAgentLabel(id), status: "pending" as const })));

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        // Create the regression scenario
        const createRes = await fetch("/api/regression-runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          signal: abort.signal,
        });

        if (!createRes.ok) {
          let message = "Failed to create regression run";
          try {
            const err = await createRes.json();
            message = err.message || message;
          } catch {
            // Response body was empty or not JSON
          }
          throw new Error(message);
        }

        const { id } = await createRes.json();
        setScenarioId(id);

        // Start SSE stream
        const eventSource = new EventSource(`/api/regression-runs/${id}/stream`);

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

        eventSource.addEventListener("plan_review", (event) => {
          const data = JSON.parse(event.data);
          setPendingPlan(data.plan);
          setPipelineState("awaiting_plan_approval");
        });

        eventSource.addEventListener("script", (event) => {
          const data = JSON.parse(event.data);
          addMessage({ type: "script", code: data.code });
        });

        eventSource.addEventListener("pr_created", (event) => {
          const data = JSON.parse(event.data);
          setPrUrl(data.url);
          addMessage({ type: "pr_link", url: data.url });
          setPipelineState("completed");
        });

        eventSource.addEventListener("error_event", (event) => {
          const data = JSON.parse(event.data);
          addMessage({ type: "error", text: data.message });
          if (data.agent) {
            updateStep(data.agent, "failed");
          }
          setPipelineState("failed");
          eventSource.close();
        });

        eventSource.addEventListener("done", () => {
          setPipelineState((prev) =>
            prev !== "completed" && prev !== "failed" ? "completed" : prev
          );
          eventSource.close();
        });

        eventSource.onerror = () => {
          eventSource.close();
          setPipelineState((prev) => {
            if (prev === "running") {
              addMessage({ type: "error", text: "Connection to agent pipeline lost." });
              return "failed";
            }
            return prev;
          });
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

  // --- Plan Approval Handlers ---

  const handleAcceptPlan = useCallback(async () => {
    if (pendingPlan) {
      addMessage({ type: "prompt", text: pendingPlan });
    }
    setPendingPlan(null);
    setPipelineState("running");

    if (scenarioId) {
      await fetch(`/api/regression-runs/${scenarioId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "accept_plan" }),
      });
    }
  }, [scenarioId, pendingPlan, addMessage]);

  const handleRejectPlan = useCallback(
    async (reason: string) => {
      addMessage({ type: "user", text: `Rejected: ${reason}` });
      setPendingPlan(null);
      setPipelineState("running");

      if (scenarioId) {
        await fetch(`/api/regression-runs/${scenarioId}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "reject_plan", reason }),
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

  // Dummy handlers for AgentChatPanel props (no question flow in regression)
  const noop = useCallback(() => {}, []);
  const noopAsync = useCallback(async () => {}, []);

  const isFormDisabled = pipelineState !== "idle" && pipelineState !== "completed" && pipelineState !== "failed";

  return (
    <div className="space-y-4">
      {/* Agent Pipeline Bar — 3 steps */}
      <AgentPipelineBar steps={steps} prUrl={prUrl} />

      {/* Two-column layout: Config + Agent Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left — Configuration Form */}
        <div className="lg:col-span-1">
          <RegressionTestForm
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
              pendingQuestion={null}
              pendingPrompt={pendingPlan}
              onAnswer={noopAsync as unknown as (answer: string) => void}
              onAcceptPrompt={handleAcceptPlan}
              onRejectPrompt={handleRejectPlan}
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
  return id.charAt(0).toUpperCase() + id.slice(1);
}
