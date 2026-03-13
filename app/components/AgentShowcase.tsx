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
    iconBg: "bg-gradient-to-br from-primary/20 to-primary/10",
    iconText: "text-primary",
    statusDot: "bg-primary",
    statusGlow: "bg-primary/50",
    borderGradient: "border-primary/30",
  },
  accent: {
    iconBg: "bg-gradient-to-br from-accent/20 to-accent/10",
    iconText: "text-accent",
    statusDot: "bg-accent",
    statusGlow: "bg-accent/50",
    borderGradient: "border-accent/30",
  },
  emerald: {
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10",
    iconText: "text-emerald-400",
    statusDot: "bg-emerald-500",
    statusGlow: "bg-emerald-500/50",
    borderGradient: "border-emerald-500/30",
  },
};

export function AgentShowcase() {
  return (
    <div>
      <style>{`
        @keyframes agent-enter {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glow-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.6);
            opacity: 0;
          }
        }

        @keyframes card-shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .agent-card {
          animation: agent-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          position: relative;
          border: 1px solid rgba(167, 139, 250, 0.2);
          background: linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 0.5) 100%);
        }

        .agent-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(6, 182, 212, 0.1));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.3s ease-out;
        }

        .agent-card:hover::before {
          opacity: 1;
        }

        .agent-card:nth-child(1) { animation-delay: 0.1s; }
        .agent-card:nth-child(2) { animation-delay: 0.2s; }
        .agent-card:nth-child(3) { animation-delay: 0.3s; }

        .agent-card:hover {
          border-color: rgba(167, 139, 250, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(167, 139, 250, 0.15);
        }

        .status-pulse {
          animation: glow-pulse 2.5s ease-in-out infinite;
        }

        .agent-icon {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .agent-card:hover .agent-icon {
          transform: scale(1.1) rotate(5deg);
        }
      `}</style>

      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-base font-bold text-text-primary">
          Meet Your Agents
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {agents.map((agent) => {
          const styles = colorStyles[agent.color];
          return (
            <div
              key={agent.name}
              className="agent-card group relative overflow-hidden rounded-xl p-5 transition-all duration-300"
            >
              <div className="flex items-start justify-between relative z-10">
                <div
                  className={`agent-icon flex h-10 w-10 items-center justify-center rounded-lg ${styles.iconBg} ${styles.iconText}`}
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
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Ready
                  </span>
                </div>
              </div>

              <div className="mt-4 relative z-10">
                <h3 className="text-sm font-bold text-text-primary">
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
