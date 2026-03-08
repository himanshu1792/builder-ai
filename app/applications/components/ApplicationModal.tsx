"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ApplicationView } from "@/lib/applications";
import {
  createApplicationAction,
  updateApplicationAction,
} from "@/lib/actions/applications";
import type { ActionState } from "@/lib/actions/applications";
import { PasswordField } from "./PasswordField";

interface ApplicationModalProps {
  mode: "create" | "edit";
  application?: ApplicationView;
  isOpen: boolean;
  onClose: () => void;
}

const initialState: ActionState = {
  success: false,
};

export function ApplicationModal({
  mode,
  application,
  isOpen,
  onClose,
}: ApplicationModalProps) {
  const action =
    mode === "edit" && application
      ? updateApplicationAction.bind(null, application.id)
      : createApplicationAction;

  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close modal on successful edit (create redirects via server action)
  useEffect(() => {
    if (state.success && mode === "edit") {
      onClose();
    }
  }, [state.success, mode, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title = mode === "create" ? "Add Application" : "Edit Application";
  const submitLabel = mode === "create" ? "Create" : "Save Changes";
  const pendingLabel = mode === "create" ? "Creating..." : "Saving...";

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
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
          {title}
        </h2>

        {/* General error message */}
        {state.message && !state.success && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.message}
          </div>
        )}

        {/* Form */}
        <form ref={formRef} action={formAction} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Application Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={application?.name}
              className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                state.errors?.name
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-border hover:border-border-hover"
              }`}
              placeholder="My Web Application"
            />
            {state.errors?.name && (
              <p className="mt-1.5 text-xs text-red-600">
                {state.errors.name[0]}
              </p>
            )}
          </div>

          {/* Test URL */}
          <div>
            <label
              htmlFor="testUrl"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Test URL
            </label>
            <input
              id="testUrl"
              name="testUrl"
              type="url"
              defaultValue={application?.testUrl}
              className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                state.errors?.testUrl
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-border hover:border-border-hover"
              }`}
              placeholder="https://staging.example.com"
            />
            {state.errors?.testUrl && (
              <p className="mt-1.5 text-xs text-red-600">
                {state.errors.testUrl[0]}
              </p>
            )}
          </div>

          {/* Test Username */}
          <div>
            <label
              htmlFor="testUsername"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Test Username
            </label>
            <input
              id="testUsername"
              name="testUsername"
              type="text"
              defaultValue={application?.testUsername}
              className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                state.errors?.testUsername
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-border hover:border-border-hover"
              }`}
              placeholder="admin@example.com"
            />
            {state.errors?.testUsername && (
              <p className="mt-1.5 text-xs text-red-600">
                {state.errors.testUsername[0]}
              </p>
            )}
          </div>

          {/* Test Password */}
          <PasswordField
            name="testPassword"
            label="Test Password"
            defaultValue={application?.testPassword}
            error={state.errors?.testPassword}
          />

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
              {pending ? pendingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
