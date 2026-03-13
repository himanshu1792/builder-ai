const statusConfig: Record<string, { label: string; className: string }> = {
  queued: {
    label: "Queued",
    className: "bg-white/[0.05] text-gray-400",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-500/10 text-blue-400",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-400",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/10 text-red-400",
  },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.queued;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
