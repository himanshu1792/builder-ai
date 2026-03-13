"use client";

import type { RepositoryListItem } from "@/lib/repository-utils";
import { extractRepoName } from "@/lib/repository-utils";
import { EditRepoRow } from "./EditRepoRow";

interface RepositoryRowProps {
  repository: RepositoryListItem;
  applicationId: string;
  onDelete: (id: string, name: string) => void;
  onEdit: (id: string) => void;
  isEditing: boolean;
  onCancelEdit: () => void;
}

function GitHubIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-text-primary"
    >
      <path
        d="M9 19C4.7 20.4 4.7 16.5 3 16M15 21V17.5C15 16.5 15.1 16.1 14.5 15.5C17.3 15.2 20 14.1 20 9.5C19.9988 8.30498 19.5325 7.15726 18.7 6.3C19.0905 5.26198 19.0545 4.11164 18.6 3.1C18.6 3.1 17.5 2.8 15.1 4.4C13.0672 3.87095 10.9328 3.87095 8.9 4.4C6.5 2.8 5.4 3.1 5.4 3.1C4.94548 4.11164 4.90953 5.26198 5.3 6.3C4.46745 7.15726 4.00122 8.30498 4 9.5C4 14.1 6.7 15.2 9.5 15.5C8.9 16.1 8.9 16.7 9 17.5V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AdoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-text-primary"
    >
      <path
        d="M22 7.5L14.5 2V6.5L8 9L2 7V17L8 15L14.5 17.5V22L22 16.5V7.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RepositoryRow({
  repository,
  applicationId,
  onDelete,
  onEdit,
  isEditing,
  onCancelEdit,
}: RepositoryRowProps) {
  if (isEditing) {
    return (
      <EditRepoRow
        repository={repository}
        applicationId={applicationId}
        onCancel={onCancelEdit}
      />
    );
  }

  const repoName = (() => {
    try {
      return extractRepoName(
        repository.repoUrl,
        repository.provider as "github" | "ado"
      );
    } catch {
      return repository.repoUrl;
    }
  })();

  return (
    <div className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-dim">
      {/* Left side: icon, name, output folder */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-dim">
          {repository.provider === "github" ? <GitHubIcon /> : <AdoIcon />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">
            {repoName}
          </p>
          <p className="truncate text-xs text-text-muted">
            {repository.outputFolder}
          </p>
        </div>
      </div>

      {/* Right side: action buttons (visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Edit button */}
        <button
          type="button"
          onClick={() => onEdit(repository.id)}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
          aria-label="Edit output folder"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.5913C12.1735 1.49655 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49655 13.388 1.5913C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.581 14.5032 3.8262 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L4.99967 13.6667L1.33301 14.6667L2.33301 11L11.333 2.00004Z"
              stroke="currentColor"
              strokeWidth="1.33"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Delete button */}
        <button
          type="button"
          onClick={() => onDelete(repository.id, repoName)}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="Delete repository"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 4H3.33333H14"
              stroke="currentColor"
              strokeWidth="1.33"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5.33301 4.00004V2.66671C5.33301 2.31309 5.47348 1.97395 5.72353 1.7239C5.97358 1.47385 6.31272 1.33337 6.66634 1.33337H9.33301C9.68663 1.33337 10.0258 1.47385 10.2758 1.7239C10.5259 1.97395 10.6663 2.31309 10.6663 2.66671V4.00004M12.6663 4.00004V13.3334C12.6663 13.687 12.5259 14.0261 12.2758 14.2762C12.0258 14.5262 11.6866 14.6667 11.333 14.6667H4.66634C4.31272 14.6667 3.97358 14.5262 3.72353 14.2762C3.47348 14.0261 3.33301 13.687 3.33301 13.3334V4.00004H12.6663Z"
              stroke="currentColor"
              strokeWidth="1.33"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
