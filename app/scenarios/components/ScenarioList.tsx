import Link from "next/link";
import type { ScenarioListItem } from "@/lib/scenarios";
import { StatusBadge } from "./StatusBadge";

interface ScenarioListProps {
  scenarios: ScenarioListItem[];
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 30)
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ScenarioList({ scenarios }: ScenarioListProps) {
  if (scenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16">
        {/* Scenario icon */}
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path
              d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 2V8H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 13H8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 17H8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 9H8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="mb-1 text-sm font-medium text-text-primary">
          No scenarios yet
        </p>
        <p className="mb-4 text-xs text-text-muted">
          Create your first test scenario to start generating Playwright scripts.
        </p>
        <Link
          href="/scenarios/new"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-dim"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 3.33337V12.6667"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3.33301 8H12.6663"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          New Scenario
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {scenarios.map((scenario) => (
        <Link
          key={scenario.id}
          href={`/scenarios/${scenario.id}`}
          className="group block rounded-xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:border-border-hover hover:shadow-md"
        >
          {/* Top row: input text + status badge */}
          <div className="mb-3 flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-text-primary line-clamp-2">
              {scenario.inputText.length > 120
                ? `${scenario.inputText.slice(0, 120)}...`
                : scenario.inputText}
            </p>
            <div className="shrink-0">
              <StatusBadge status={scenario.status} />
            </div>
          </div>

          {/* Bottom row: app name, repo provider, timestamp */}
          <div className="flex items-center gap-3 text-xs text-text-muted">
            {/* Application name */}
            <span className="flex items-center gap-1">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="1"
                  y="1"
                  width="10"
                  height="10"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <path
                  d="M1 4H11"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
              {scenario.application.name}
            </span>

            <span className="text-border">|</span>

            {/* Repository provider */}
            <span className="flex items-center gap-1">
              {scenario.repository.provider === "github" ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.5 9.5C2.35 10.2 2.35 8.25 1.5 8M7.5 10.5V8.75C7.5 8.25 7.55 8.05 7.25 7.75C8.65 7.6 10 7.05 10 4.75C9.99941 4.15249 9.76627 3.57863 9.35 3.15C9.54523 2.63099 9.52727 2.05582 9.3 1.55C9.3 1.55 8.75 1.4 7.55 2.2C6.53361 1.93548 5.46639 1.93548 4.45 2.2C3.25 1.4 2.7 1.55 2.7 1.55C2.47273 2.05582 2.45477 2.63099 2.65 3.15C2.23373 3.57863 2.00059 4.15249 2 4.75C2 7.05 3.35 7.6 4.75 7.75C4.45 8.05 4.45 8.35 4.5 8.75V10.5"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1H5.5V5.5H1V1Z"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <path
                    d="M6.5 1H11V5.5H6.5V1Z"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <path
                    d="M1 6.5H5.5V11H1V6.5Z"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <path
                    d="M6.5 6.5H11V11H6.5V6.5Z"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </svg>
              )}
              {scenario.repository.provider === "github"
                ? "GitHub"
                : "Azure DevOps"}
            </span>

            <span className="text-border">|</span>

            {/* Timestamp */}
            <span className="flex items-center gap-1">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 3V6L8 7"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {formatRelativeTime(scenario.createdAt)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
