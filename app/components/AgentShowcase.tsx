"use client";

const agents = [
  {
    name: "Planner",
    description:
      "Analyzes your test scenarios and creates structured, professional testing plans",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 21H15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M10 18V21"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M14 18V21"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    color: "primary" as const,
  },
  {
    name: "Executor",
    description:
      "Executes test plans in a real browser using Playwright's testing framework",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 4L20 12L6 20V4Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: "accent" as const,
  },
  {
    name: "Healer",
    description:
      "Automatically fixes broken test scripts when application UI changes",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: "emerald" as const,
  },
];

const colorStyles = {
  primary: {
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    statusDot: "bg-primary",
    statusGlow: "bg-primary/40",
  },
  accent: {
    iconBg: "bg-accent/10",
    iconText: "text-accent",
    statusDot: "bg-accent",
    statusGlow: "bg-accent/40",
  },
  emerald: {
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    statusDot: "bg-emerald-500",
    statusGlow: "bg-emerald-500/40",
  },
};

export function AgentShowcase() {
  return (
    <div>
      <style>{`
        @keyframes agent-enter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        .agent-card {
          animation: agent-enter 0.5s ease-out both;
        }

        .agent-card:nth-child(1) { animation-delay: 0.1s; }
        .agent-card:nth-child(2) { animation-delay: 0.25s; }
        .agent-card:nth-child(3) { animation-delay: 0.4s; }

        .status-pulse {
          animation: pulse-glow 2.5s ease-in-out infinite;
        }
      `}</style>

      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-sm font-semibold text-text-primary">
          Meet Your Agents
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {agents.map((agent) => {
          const styles = colorStyles[agent.color];
          return (
            <div
              key={agent.name}
              className="agent-card group relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-border-hover hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${styles.iconBg} ${styles.iconText}`}
                >
                  {agent.icon}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex h-4 w-4 items-center justify-center">
                    <span
                      className={`status-pulse absolute h-2.5 w-2.5 rounded-full ${styles.statusGlow}`}
                    />
                    <span
                      className={`relative h-1.5 w-1.5 rounded-full ${styles.statusDot}`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-text-muted">
                    Ready
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-text-primary">
                  {agent.name}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  {agent.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
