import Link from "next/link";
import { listApplications } from "@/lib/applications";
import { DashboardStats } from "./components/DashboardStats";
import { AgentShowcase } from "./components/AgentShowcase";

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
      <style>{`
        @keyframes header-fade {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .page-header {
          animation: header-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
      
      {/* Welcome Header */}
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-text-primary">
            Command Center
          </h1>
          <p className="mt-2 text-base text-text-secondary max-w-2xl">
            AI-powered test generation. Describe what to test, get working
            Playwright scripts.
          </p>
        </div>
        <Link
          href="/applications"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-surface shadow-lg shadow-primary/30 transition-all duration-200 hover:shadow-xl hover:shadow-primary/50 hover:scale-105 active:scale-95"
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
          <div className="rounded-xl border border-border bg-surface-dim hover:border-primary/40 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-gradient-to-r from-surface-dim to-surface-inset">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Recent Applications
              </h2>
              {appCount > 0 && (
                <Link
                  href="/applications"
                  className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors duration-200"
                >
                  View All →
                </Link>
              )}
            </div>

            {recentApps.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentApps.map((app, idx) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-all duration-200 hover:bg-surface-hover group cursor-pointer"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 text-xs font-bold text-primary group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-200 group-hover:scale-110">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {app.name}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {app.testUrl}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-text-muted font-medium">
                      {timeAgo(app.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/10 animate-float">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-primary"
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
                <p className="mt-3 text-sm font-bold text-text-secondary">
                  No applications registered yet
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Add your first application to start generating tests.
                </p>
                <Link
                  href="/applications"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors duration-200 hover:gap-2"
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
          <div className="rounded-xl border border-border bg-surface-dim hover:border-accent/40 transition-all duration-300 group">
            <div className="border-b border-border px-5 py-4 bg-gradient-to-r from-surface-dim to-surface-inset">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Last Run
              </h2>
            </div>
            <div className="px-5 py-10 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent/30 to-cyan-600/10 text-accent group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-accent/30 transition-all duration-300 animate-float">
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
              <p className="mt-3 text-xs font-bold text-text-secondary">
                No test runs yet
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Recent test executions will appear here.
              </p>
            </div>
          </div>

          {/* Recent Scripts Placeholder */}
          <div className="rounded-xl border border-border bg-surface-dim hover:border-primary/40 transition-all duration-300 group">
            <div className="border-b border-border px-5 py-4 bg-gradient-to-r from-surface-dim to-surface-inset">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Recent Scripts
              </h2>
            </div>
            <div className="px-5 py-10 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-purple-600/10 text-primary group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300 animate-float">
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
              <p className="mt-3 text-xs font-bold text-text-secondary">
                No scripts generated yet
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Generated Playwright scripts will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Meet Your Agents */}
      <AgentShowcase />
    </div>
  );
}
