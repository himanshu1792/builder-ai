"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { ScenarioView } from "@/lib/scenarios";
import { StatusBadge } from "@/app/scenarios/components/StatusBadge";

/** Strip wrapping ```markdown ... ``` code fences from AI output */
function stripCodeFence(text: string): string {
  return text.replace(/^```(?:markdown)?\s*\n?/, "").replace(/\n?```\s*$/, "");
}

interface RunDetailClientProps {
  scenario: ScenarioView;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RunDetailClient({ scenario }: RunDetailClientProps) {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/run-history"
        className="inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Run History
      </Link>

      {/* Header Card */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-text-primary">Run Details</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              scenario.type === "regression"
                ? "bg-violet-100 text-violet-700"
                : "bg-sky-100 text-sky-700"
            }`}>
              {scenario.type === "regression" ? "Regression Test" : "Smoke Test"}
            </span>
          </div>
          <StatusBadge status={scenario.status} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <path d="M1.5 4.5H12.5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            {scenario.application.name}
          </span>
          <span className="text-border">|</span>
          <span>{scenario.repository.provider === "github" ? "GitHub" : "Azure DevOps"}</span>
          <span className="text-border">|</span>
          <span>{formatDate(scenario.createdAt)}</span>
        </div>
      </div>

      {/* Section: Original Input */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Original Input</h2>
        <div className="whitespace-pre-wrap rounded-lg bg-surface-inset p-4 text-sm text-text-primary">
          {scenario.inputText}
        </div>
      </div>

      {/* Section: Test Plan (regression only) */}
      {scenario.type === "regression" && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Test Plan</h2>
          {scenario.testPlan ? (
            <div className="prose prose-sm max-w-none rounded-lg bg-surface-inset p-4 text-text-primary prose-headings:text-text-primary prose-strong:text-text-primary prose-li:text-text-primary">
              <ReactMarkdown>{stripCodeFence(scenario.testPlan)}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm italic text-text-muted">No test plan generated.</p>
          )}
        </div>
      )}

      {/* Section: Refined Prompt (smoke only) */}
      {scenario.type !== "regression" && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Refined Prompt</h2>
          {scenario.refinedPrompt ? (
            <div className="prose prose-sm max-w-none rounded-lg bg-surface-inset p-4 text-text-primary prose-headings:text-text-primary prose-strong:text-text-primary prose-li:text-text-primary">
              <ReactMarkdown>{stripCodeFence(scenario.refinedPrompt)}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm italic text-text-muted">No refined prompt generated.</p>
          )}
        </div>
      )}

      {/* Section: Generated Script */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Generated Script</h2>
        {scenario.generatedScript ? (
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
            <code>{scenario.generatedScript}</code>
          </pre>
        ) : (
          <p className="text-sm italic text-text-muted">No script generated.</p>
        )}
      </div>

      {/* Section: PR Link */}
      {scenario.prUrl && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-emerald-800">Pull Request</h2>
          <a
            href={scenario.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            View Pull Request
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5.25 2.33H2.33V11.67H11.67V8.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.58 1.17H12.83V6.42" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.83 1.17L5.83 8.17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      )}

      {/* Section: Error Details */}
      {scenario.status === "failed" && (
        <div className="rounded-xl border border-red-200 bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-red-700">Error Details</h2>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {scenario.errorMessage || "An unknown error occurred."}
          </div>
        </div>
      )}
    </div>
  );
}
