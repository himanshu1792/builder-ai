"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApplicationView } from "@/lib/applications";
import type { RepositoryListItem } from "@/lib/repositories";
import { deleteApplicationAction } from "@/lib/actions/applications";
import { AppDetailHeader } from "./AppDetailHeader";

interface AppDetailClientProps {
  application: ApplicationView;
  repositories: RepositoryListItem[];
}

export function AppDetailClient({
  application,
  repositories,
}: AppDetailClientProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteBackdropRef = useRef<HTMLDivElement>(null);

  // Handle escape key for delete dialog
  useEffect(() => {
    if (!showDelete) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !deleting) setShowDelete(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showDelete, deleting]);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);

    const result = await deleteApplicationAction(application.id);

    if (result.success) {
      router.push("/applications");
    } else {
      setDeleteError(result.message ?? "Failed to delete application.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/applications"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        {/* Left arrow */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to Applications
      </Link>

      {/* Application Details */}
      <AppDetailHeader
        application={application}
        editing={editing}
        onEditToggle={() => setEditing(!editing)}
        onDelete={() => setShowDelete(true)}
      />

      {/* Connected Repositories Section */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary">
            Connected Repositories
          </h3>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white opacity-60 shadow-sm shadow-primary/25 transition-all duration-200"
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

        {repositories.length === 0 ? (
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
            <p className="text-xs text-text-muted">
              Connect a GitHub or Azure DevOps repository to start generating tests.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-dim">
                    <span className="text-xs font-medium text-text-secondary">
                      {repo.provider === "github" ? "GH" : "ADO"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {repo.repoUrl}
                    </p>
                    <p className="text-xs text-text-muted">
                      Output: {repo.outputFolder}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDelete && (
        <div
          ref={deleteBackdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === deleteBackdropRef.current && !deleting)
              setShowDelete(false);
          }}
        >
          <div className="relative mx-4 w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
            {/* Warning icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-red-600"
              >
                <path
                  d="M12 9V13M12 17H12.01M10.29 3.86L1.82002 18C1.64539 18.3024 1.55299 18.6453 1.55201 18.9945C1.55103 19.3437 1.6415 19.6871 1.81445 19.9905C1.98741 20.2939 2.23675 20.5468 2.53773 20.7239C2.83871 20.901 3.18082 20.9961 3.53002 21H20.47C20.8192 20.9961 21.1613 20.901 21.4623 20.7239C21.7633 20.5468 22.0126 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5318 3.56611 13.2807 3.32312 12.9812 3.15449C12.6817 2.98585 12.3438 2.89725 12 2.89725C11.6562 2.89725 11.3183 2.98585 11.0188 3.15449C10.7193 3.32312 10.4682 3.56611 10.29 3.86Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Title */}
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              Delete Application
            </h2>

            {/* Message */}
            <p className="mb-2 text-sm text-text-secondary">
              Are you sure you want to delete{" "}
              <span className="font-medium text-text-primary">
                {application.name}
              </span>
              ? This action cannot be undone.
            </p>

            {/* Repository warning */}
            {repositories.length > 0 && (
              <p className="mb-4 text-sm font-medium text-red-600">
                This will also remove {repositories.length} connected{" "}
                {repositories.length === 1 ? "repository" : "repositories"}.
              </p>
            )}

            {/* Error */}
            {deleteError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                disabled={deleting}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-dim disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
