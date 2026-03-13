"use client";

import Link from "next/link";
import type { ScenarioView } from "@/lib/scenarios";
import { StatusBadge } from "../../components/StatusBadge";

interface ScenarioDetailClientProps {
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

export function ScenarioDetailClient({ scenario }: ScenarioDetailClientProps) {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/testing/scenarios"
        className="inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to Scenarios
      </Link>

      {/* Header Card */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h1 className="text-lg font-semibold text-text-primary">
            Scenario Details
          </h1>
          <StatusBadge status={scenario.status} />
        </div>
        <div className="flex items-center gap-3 text-sm text-text-muted">
          {/* Application name */}
          <span className="flex items-center gap-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="1.5"
                y="1.5"
                width="11"
                height="11"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M1.5 4.5H12.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            {scenario.application.name}
          </span>

          <span className="text-border">|</span>

          {/* Repository URL */}
          <span className="flex items-center gap-1.5">
            {scenario.repository.provider === "github" ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.25 11.08C3.27 11.73 3.27 9.62 2.45 9.33M8.75 12.25V10.21C8.75 9.63 8.81 9.39 8.46 9.04C10.09 8.87 11.67 8.23 11.67 5.54C11.666 4.84 11.393 4.17 10.91 3.67C11.14 3.07 11.12 2.4 10.85 1.81C10.85 1.81 10.21 1.63 8.81 2.57C7.63 2.26 6.38 2.26 5.2 2.57C3.79 1.63 3.15 1.81 3.15 1.81C2.89 2.4 2.86 3.07 3.09 3.67C2.61 4.17 2.33 4.84 2.33 5.54C2.33 8.23 3.91 8.87 5.54 9.04C5.19 9.39 5.19 9.74 5.25 10.21V12.25"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.5 1.5H6.5V6.5H1.5V1.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M7.5 1.5H12.5V6.5H7.5V1.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M1.5 7.5H6.5V12.5H1.5V7.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M7.5 7.5H12.5V12.5H7.5V7.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
            )}
            {scenario.repository.repoUrl}
          </span>

          <span className="text-border">|</span>

          {/* Created timestamp */}
          <span className="flex items-center gap-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 12.83C10.22 12.83 12.83 10.22 12.83 7C12.83 3.78 10.22 1.17 7 1.17C3.78 1.17 1.17 3.78 1.17 7C1.17 10.22 3.78 12.83 7 12.83Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 3.5V7L9.33 8.17"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {formatDate(scenario.createdAt)}
          </span>
        </div>
      </div>

      {/* Section: Original Input */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Original Input
        </h2>
        <div className="whitespace-pre-wrap rounded-lg bg-surface-inset p-4 text-sm text-text-primary">
          {scenario.inputText}
        </div>
      </div>

      {/* Section: Refined Prompt */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Refined Prompt
        </h2>
        {scenario.refinedPrompt ? (
          <div className="whitespace-pre-wrap rounded-lg bg-surface-inset p-4 text-sm text-text-primary">
            {scenario.refinedPrompt}
          </div>
        ) : (
          <p className="text-sm italic text-text-muted">
            Waiting for AI refinement...
          </p>
        )}
      </div>

      {/* Section: Generated Script */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Generated Script
        </h2>
        {scenario.generatedScript ? (
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
            <code>{scenario.generatedScript}</code>
          </pre>
        ) : (
          <p className="text-sm italic text-text-muted">
            Script will appear here after generation...
          </p>
        )}
      </div>

      {/* Section: Error Details (only when status is "failed") */}
      {scenario.status === "failed" && (
        <div className="rounded-xl border border-red-200 bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-red-700">
            Error Details
          </h2>
          {scenario.errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {scenario.errorMessage}
            </div>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              An unknown error occurred.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
