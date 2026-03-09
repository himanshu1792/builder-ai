import Link from "next/link";
import type { ApplicationListItem } from "@/lib/applications";

interface ApplicationCardProps {
  application: ApplicationListItem;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const formattedDate = new Date(application.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <Link
      href={`/applications/${application.id}`}
      className="group block cursor-pointer rounded-xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:border-border-hover hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-text-primary">
          {application.name}
        </h3>
      </div>

      {/* URL */}
      <p
        className="mb-3 truncate text-sm text-text-secondary"
        title={application.testUrl}
      >
        {application.testUrl}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
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
        <span>Created {formattedDate}</span>
      </div>
    </Link>
  );
}
