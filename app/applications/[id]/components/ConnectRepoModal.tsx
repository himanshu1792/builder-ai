"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { connectRepositoryAction } from "@/lib/actions/repositories";
import type { ActionState } from "@/lib/actions/applications";
import { PasswordField } from "@/app/applications/components/PasswordField";
import { slugify } from "@/lib/repository-utils";

interface ConnectRepoModalProps {
  applicationId: string;
  applicationName: string;
  isOpen: boolean;
  onClose: () => void;
}

const initialState: ActionState = {
  success: false,
};

export function ConnectRepoModal({
  applicationId,
  applicationName,
  isOpen,
  onClose,
}: ConnectRepoModalProps) {
  const [provider, setProvider] = useState<"github" | "ado">("github");
  const action = connectRepositoryAction.bind(null, applicationId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close modal on success
  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pending, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current && !pending) onClose();
      }}
    >
      <div className="relative mx-4 w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-dim hover:text-text-secondary"
          aria-label="Close modal"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Title */}
        <h2 className="mb-6 text-lg font-semibold text-text-primary">
          Connect Repository
        </h2>

        {/* General error message (PAT validation errors) */}
        {state.message && !state.success && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {state.message}
          </div>
        )}

        {/* Form */}
        <form ref={formRef} action={formAction} className="space-y-4">
          {/* Hidden provider input */}
          <input type="hidden" name="provider" value={provider} />

          {/* Provider Toggle */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Provider
            </label>
            <div className="flex rounded-lg border border-border bg-surface-dim p-0.5">
              <button
                type="button"
                onClick={() => setProvider("github")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  provider === "github"
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                GitHub
              </button>
              <button
                type="button"
                onClick={() => setProvider("ado")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  provider === "ado"
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                Azure DevOps
              </button>
            </div>
          </div>

          {/* Repository URL */}
          <div>
            <label
              htmlFor="repoUrl"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Repository URL
            </label>
            <input
              id="repoUrl"
              name="repoUrl"
              type="text"
              className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                state.errors?.repoUrl
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-border hover:border-border-hover"
              }`}
              placeholder={
                provider === "github"
                  ? "https://github.com/org/repo"
                  : "https://dev.azure.com/org/project/_git/repo"
              }
            />
            {state.errors?.repoUrl && (
              <p className="mt-1.5 text-xs text-red-600">
                {state.errors.repoUrl[0]}
              </p>
            )}
          </div>

          {/* Organization (ADO only) */}
          {provider === "ado" && (
            <div>
              <label
                htmlFor="organization"
                className="mb-1.5 block text-sm font-medium text-text-primary"
              >
                Organization
              </label>
              <input
                id="organization"
                name="organization"
                type="text"
                className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  state.errors?.organization
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                    : "border-border hover:border-border-hover"
                }`}
                placeholder="Organization name"
              />
              {state.errors?.organization && (
                <p className="mt-1.5 text-xs text-red-600">
                  {state.errors.organization[0]}
                </p>
              )}
            </div>
          )}

          {/* Personal Access Token */}
          <PasswordField
            name="pat"
            label="Personal Access Token"
            error={state.errors?.pat}
          />

          {/* Output Folder */}
          <div>
            <label
              htmlFor="outputFolder"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Output Folder
            </label>
            <input
              id="outputFolder"
              name="outputFolder"
              type="text"
              defaultValue={`tests/${slugify(applicationName)}`}
              className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                state.errors?.outputFolder
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-border hover:border-border-hover"
              }`}
              placeholder="tests/my-web-app"
            />
            {state.errors?.outputFolder && (
              <p className="mt-1.5 text-xs text-red-600">
                {state.errors.outputFolder[0]}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-dim"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-all duration-200 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending && (
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
              {pending ? "Connecting..." : "Connect Repository"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
