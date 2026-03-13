"use client";

import type { RepositoryListItem } from "@/lib/repository-utils";
import { RepositoryRow } from "./RepositoryRow";

interface RepositoryListProps {
  repositories: RepositoryListItem[];
  applicationId: string;
  applicationName: string;
  onConnectClick: () => void;
  editingRepoId: string | null;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string, name: string) => void;
}

export function RepositoryList({
  repositories,
  applicationId,
  applicationName,
  onConnectClick,
  editingRepoId,
  onEdit,
  onCancelEdit,
  onDelete,
}: RepositoryListProps) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-semibold text-text-primary">
            Connected Repositories
          </h3>
          {repositories.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
              {repositories.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onConnectClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-all duration-200 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/30"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 3.33337V12.6667"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3.33301 8H12.6663"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Connect Repository
        </button>
      </div>

      {/* Content */}
      {repositories.length === 0 ? (
        <div className="px-6 pb-6">
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-10">
            {/* Repository icon */}
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path
                  d="M9 19C4.7 20.4 4.7 16.5 3 16M15 21V17.5C15 16.5 15.1 16.1 14.5 15.5C17.3 15.2 20 14.1 20 9.5C19.9988 8.30498 19.5325 7.15726 18.7 6.3C19.0905 5.26198 19.0545 4.11164 18.6 3.1C18.6 3.1 17.5 2.8 15.1 4.4C13.0672 3.87095 10.9328 3.87095 8.9 4.4C6.5 2.8 5.4 3.1 5.4 3.1C4.94548 4.11164 4.90953 5.26198 5.3 6.3C4.46745 7.15726 4.00122 8.30498 4 9.5C4 14.1 6.7 15.2 9.5 15.5C8.9 16.1 8.9 16.7 9 17.5V21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="mb-1 text-sm font-medium text-text-primary">
              No repositories connected
            </p>
            <p className="mb-4 text-xs text-text-muted">
              Connect a GitHub or Azure DevOps repository to start generating
              tests.
            </p>
            <button
              type="button"
              onClick={onConnectClick}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-dim"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 3.33337V12.6667"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.33301 8H12.6663"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Connect Repository
            </button>
          </div>
        </div>
      ) : (
        <div>
          {repositories.map((repo, index) => (
            <div
              key={repo.id}
              className={index > 0 ? "border-t border-border" : ""}
            >
              <RepositoryRow
                repository={repo}
                applicationId={applicationId}
                onDelete={onDelete}
                onEdit={onEdit}
                isEditing={editingRepoId === repo.id}
                onCancelEdit={onCancelEdit}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
