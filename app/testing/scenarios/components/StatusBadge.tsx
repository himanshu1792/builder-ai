const statusConfig: Record<string, { label: string; className: string }> = {
  queued: {
    label: "Queued",
    className: "bg-gray-100 text-gray-600",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700",
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
