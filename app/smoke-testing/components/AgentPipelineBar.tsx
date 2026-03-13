"use client";

export type AgentStep = {
  id: string;
  label: string;
  status: "pending" | "active" | "complete" | "failed";
};

const defaultSteps: AgentStep[] = [
  { id: "analyst", label: "Analyst", status: "pending" },
  { id: "prompt_builder", label: "Prompt Builder", status: "pending" },
  { id: "script_generator", label: "Script Generator", status: "pending" },
  { id: "reviewer", label: "Reviewer", status: "pending" },
  { id: "pr_creator", label: "PR Creator", status: "pending" },
];

interface AgentPipelineBarProps {
  steps?: AgentStep[];
  prUrl?: string | null;
}

export function AgentPipelineBar({ steps = defaultSteps, prUrl }: AgentPipelineBarProps) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-3">
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-1">
            {/* Step pill */}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                step.status === "active"
                  ? "bg-blue-100 text-blue-700"
                  : step.status === "complete"
                  ? "bg-emerald-100 text-emerald-700"
                  : step.status === "failed"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-text-muted"
              }`}
            >
              <StepIcon status={step.status} />
              <span className="whitespace-nowrap">{step.label}</span>
            </div>

            {/* Connector line + arrow */}
            {i < steps.length - 1 && (
              <div className="flex items-center">
                <div
                  className={`h-px w-4 ${
                    steps[i + 1].status !== "pending" || step.status === "complete"
                      ? "bg-emerald-300"
                      : step.status === "active"
                      ? "bg-blue-300"
                      : "bg-gray-200"
                  }`}
                />
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className={`-ml-0.5 shrink-0 ${
                    steps[i + 1].status !== "pending" || step.status === "complete"
                      ? "text-emerald-400"
                      : step.status === "active"
                      ? "text-blue-400"
                      : "text-gray-300"
                  }`}
                >
                  <path
                    d="M4.5 3L7.5 6L4.5 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* PR link inline */}
        {prUrl && (
          <>
            <div className="mx-2 h-4 w-px bg-border" />
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M4.5 2.25H2.25V9.75H9.75V7.5"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.75 0.75H11.25V5.25"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11.25 0.75L5.25 6.75"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              View PR
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function StepIcon({ status }: { status: AgentStep["status"] }) {
  if (status === "complete") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
        <path
          d="M2.5 6L5 8.5L9.5 3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (status === "active") {
    return <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-blue-500" />;
  }

  if (status === "failed") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
        <path
          d="M3 3L9 9M9 3L3 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />;
}
