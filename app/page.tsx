import Link from "next/link";
import { listApplications } from "@/lib/applications";
import { DashboardStats } from "./components/DashboardStats";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default async function Dashboard() {
  const applications = await listApplications();
  const appCount = applications.length;
  const recentApps = applications.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Command Center
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            AI-powered test generation. Describe what to test, get working
            Playwright scripts.
          </p>
        </div>
        <Link
          href="/applications"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-all duration-150 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/30"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 1V13M1 7H13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Add Application
        </Link>
      </div>

      {/* Stats Cards */}
      <DashboardStats appCount={appCount} />

      {/* Main Content Grid: 2 columns on large screens */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Applications Overview - takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-text-primary">
                Recent Applications
              </h2>
              {appCount > 0 && (
                <Link
                  href="/applications"
                  className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  View All
                </Link>
              )}
            </div>

            {recentApps.length > 0 ? (
              <div className="divide-y divide-border">
                {recentApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-dim"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-xs font-bold text-primary">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {app.name}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {app.testUrl}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-text-muted">
                      {timeAgo(app.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-dim">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-text-muted"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="8"
                      height="8"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="13"
                      y="3"
                      width="8"
                      height="8"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="3"
                      y="13"
                      width="8"
                      height="8"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M17 14V20M14 17H20"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-text-secondary">
                  No applications registered yet
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Add your first application to start generating tests.
                </p>
                <Link
                  href="/applications"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 1V11M1 6H11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Add Application
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Placeholder sections */}
        <div className="space-y-6">
          {/* Last Run Placeholder */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-text-primary">
                Last Run
              </h2>
            </div>
            <div className="px-5 py-10 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-light">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-accent"
                >
                  <path
                    d="M8 5L13 10L8 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <p className="mt-3 text-xs font-medium text-text-secondary">
                No test runs yet
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Recent test executions will appear here.
              </p>
            </div>
          </div>

          {/* Recent Scripts Placeholder */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-text-primary">
                Recent Scripts
              </h2>
            </div>
            <div className="px-5 py-10 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary"
                >
                  <path
                    d="M6 7L3 10L6 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 7L17 10L14 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 4L8 16"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="mt-3 text-xs font-medium text-text-secondary">
                No scripts generated yet
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Generated Playwright scripts will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
