type StatCard = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "primary" | "accent" | "emerald" | "amber";
};

function StatCardItem({ label, value, icon, accent = "primary" }: StatCard) {
  const accentStyles = {
    primary: "bg-violet-500/10 text-violet-400",
    accent: "bg-blue-500/10 text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05] backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accentStyles[accent]}`}
        >
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
