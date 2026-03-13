"use client";

import { useActionState, useEffect } from "react";
import type { RepositoryListItem } from "@/lib/repository-utils";
import { updateRepositoryAction } from "@/lib/actions/repositories";
import type { ActionState } from "@/lib/actions/applications";

interface EditRepoRowProps {
  repository: RepositoryListItem;
  applicationId: string;
  onCancel: () => void;
}

const initialState: ActionState = {
  success: false,
};

export function EditRepoRow({
  repository,
  onCancel,
}: EditRepoRowProps) {
  const action = updateRepositoryAction.bind(null, repository.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  // Exit edit mode on success (page revalidates via server action)
  useEffect(() => {
    if (state.success) {
      onCancel();
    }
  }, [state.success, onCancel]);

  return (
    <div className="px-4 py-3">
      <form action={formAction} className="flex items-center gap-3">
        <div className="flex-1">
          <label htmlFor={`outputFolder-${repository.id}`} className="sr-only">
            Output Folder
          </label>
          <input
            id={`outputFolder-${repository.id}`}
            name="outputFolder"
            type="text"
            defaultValue={repository.outputFolder}
            className={`w-full rounded-lg border bg-surface px-3 py-1.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ${
              state.errors?.outputFolder
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-border hover:border-border-hover"
            }`}
            placeholder="tests/my-web-app"
          />
          {state.errors?.outputFolder && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.outputFolder[0]}
            </p>
          )}
          {state.message && !state.success && (
            <p className="mt-1 text-xs text-red-600">{state.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-primary/25 transition-all duration-200 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && (
              <svg
                className="h-3 w-3 animate-spin"
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
            {pending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-dim disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
