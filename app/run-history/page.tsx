import Link from "next/link";
import { listScenarios } from "@/lib/scenarios";
import { StatusBadge } from "@/app/scenarios/components/StatusBadge";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function RunHistoryPage() {
  const scenarios = await listScenarios();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Run History</h1>
        <p className="mt-1 text-sm text-text-muted">
          View past test generation runs and their results.
        </p>
      </div>

      {/* List */}
      {scenarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path
                d="M12 8V12L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <p className="mb-1 text-sm font-medium text-text-primary">No runs yet</p>
          <p className="mb-4 text-xs text-text-muted">
            Start a test generation from Smoke Testing to see runs here.
          </p>
          <Link
            href="/smoke-testing"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-dim"
          >
            Go to Smoke Testing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/run-history/${scenario.id}`}
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

              {/* Bottom row: type, app name, repo provider, PR link, timestamp */}
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  scenario.type === "regression"
                    ? "bg-violet-100 text-violet-700"
                    : "bg-sky-100 text-sky-700"
                }`}>
                  {scenario.type === "regression" ? "Regression" : "Smoke"}
                </span>

                <span className="text-border">|</span>

                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1" />
                    <path d="M1 4H11" stroke="currentColor" strokeWidth="1" />
                  </svg>
                  {scenario.application.name}
                </span>

                <span className="text-border">|</span>

                <span className="flex items-center gap-1">
                  {scenario.repository.provider === "github" ? "GitHub" : "Azure DevOps"}
                </span>

                {scenario.prUrl && (
                  <>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M5 1.5H2V10.5H10V7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6.5 1H10.5V5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10.5 1L5.5 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      PR
                    </span>
                  </>
                )}

                <span className="text-border">|</span>

                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z"
                      stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
                    />
                    <path d="M6 3V6L8 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {formatRelativeTime(scenario.createdAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
