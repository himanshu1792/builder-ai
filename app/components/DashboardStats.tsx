type StatCard = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "primary" | "accent" | "emerald" | "amber";
};

function StatCardItem({ label, value, icon, accent = "primary" }: StatCard) {
  const accentStyles = {
    primary: {
      bg: "bg-gradient-to-br from-primary/20 to-primary/10",
      text: "text-primary",
      border: "border-primary/20",
      hover: "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20",
    },
    accent: {
      bg: "bg-gradient-to-br from-accent/20 to-accent/10",
      text: "text-accent",
      border: "border-accent/20",
      hover: "hover:border-accent/40 hover:shadow-lg hover:shadow-accent/20",
    },
    emerald: {
      bg: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      hover: "hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/20",
    },
    amber: {
      bg: "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
      hover: "hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/20",
    },
  };

  const style = accentStyles[accent];

  return (
    <div className={`group relative overflow-hidden rounded-xl border ${style.border} bg-surface-dim p-6 transition-all duration-300 ${style.hover} hover:-translate-y-1`}>
      <style>{`
        @keyframes stat-appear {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .stat-card {
          animation: stat-appear 0.5s ease-out both;
        }
      `}</style>
      <div className="stat-card flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-text-primary">
            {value}
          </p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${style.bg} ${style.text} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function DashboardStats({ appCount }: { appCount: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCardItem
        label="Applications"
        value={appCount}
        accent="primary"
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="2"
              y="2"
              width="7"
              height="7"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x="11"
              y="2"
              width="7"
              height="7"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x="2"
              y="11"
              width="7"
              height="7"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x="11"
              y="11"
              width="7"
              height="7"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        }
      />
      <StatCardItem
        label="Tests Generated"
        value="--"
        accent="accent"
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 2L2 6L10 10L18 6L10 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M2 10L10 14L18 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M2 14L10 18L18 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        }
      />
      <StatCardItem
        label="Active Agents"
        value={3}
        accent="emerald"
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="10"
              cy="7"
              r="3"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M3 18C3 14.134 6.134 11 10 11C13.866 11 17 14.134 17 18"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        }
      />
      <StatCardItem
        label="Success Rate"
        value="N/A"
        accent="amber"
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 2V10L14.5 14.5"
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
        }
      />
    </div>
  );
}
