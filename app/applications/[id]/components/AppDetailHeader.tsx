"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ApplicationView } from "@/lib/applications";
import { updateApplicationAction } from "@/lib/actions/applications";
import type { ActionState } from "@/lib/actions/applications";

interface AppDetailHeaderProps {
  application: ApplicationView;
  editing: boolean;
  onEditToggle: () => void;
  onDelete: () => void;
}

const initialState: ActionState = {
  success: false,
};

export function AppDetailHeader({
  application,
  editing,
  onEditToggle,
  onDelete,
}: AppDetailHeaderProps) {
  const action = updateApplicationAction.bind(null, application.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Auto-toggle back to view mode on successful save
  useEffect(() => {
    if (state.success) {
      onEditToggle();
    }
  }, [state.success, onEditToggle]);

  const formattedCreated = new Date(application.createdAt).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );
  const formattedUpdated = new Date(application.updatedAt).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  if (editing) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            Edit Application
          </h2>
          <button
            type="button"
            onClick={() => {
              formRef.current?.reset();
              onEditToggle();
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-dim"
          >
            Cancel
          </button>
        </div>

        {/* General error message */}
        {state.message && !state.success && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.message}
          </div>
        )}

        <form ref={formRef} action={formAction} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="edit-name"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Application Name
            </label>
            <input
              id="edit-name"
              name="name"
              type="text"
              defaultValue={application.name}
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
              htmlFor="edit-testUrl"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Test URL
            </label>
            <input
              id="edit-testUrl"
              name="testUrl"
              type="url"
              defaultValue={application.testUrl}
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
              htmlFor="edit-testUsername"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Test Username
            </label>
            <input
              id="edit-testUsername"
              name="testUsername"
              type="text"
              defaultValue={application.testUsername}
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
          <div>
            <label
              htmlFor="edit-testPassword"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Test Password
            </label>
            <div className="relative">
              <input
                id="edit-testPassword"
                name="testPassword"
                type={passwordVisible ? "text" : "password"}
                defaultValue={application.testPassword}
                className={`w-full rounded-lg border bg-surface px-3 py-2 pr-10 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  state.errors?.testPassword
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                    : "border-border hover:border-border-hover"
                }`}
                placeholder="Enter test password"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted transition-colors hover:text-text-secondary"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
              >
                {passwordVisible ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.41301 9.41337C9.23023 9.60982 9.00943 9.76747 8.76412 9.87697C8.5188 9.98647 8.25393 10.0457 7.98539 10.0512C7.71685 10.0567 7.44984 10.0082 7.20032 9.90876C6.9508 9.8093 6.72388 9.66098 6.53178 9.46888C6.33968 9.27678 6.19136 9.04986 6.0919 8.80034C5.99244 8.55082 5.94395 8.28381 5.94943 8.01527C5.95492 7.74673 6.01419 7.48186 6.12369 7.23655C6.23319 6.99123 6.39084 6.77043 6.58729 6.58765M11.96 11.96C10.8204 12.8287 9.43274 13.3099 7.99967 13.3334C3.33301 13.3334 0.666676 8.00004 0.666676 8.00004C1.49561 6.4546 2.64609 5.10445 4.03967 4.04004L11.96 11.96ZM6.59967 2.82671C7.05856 2.71935 7.5286 2.66575 8.00034 2.66671C12.667 2.66671 15.3337 8.00004 15.3337 8.00004C14.9287 8.75712 14.446 9.46989 13.893 10.1267L6.59967 2.82671Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M0.666676 0.666626L15.3333 15.3333" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.666676 8.00004C0.666676 8.00004 3.33334 2.66671 8.00001 2.66671C12.6667 2.66671 15.3333 8.00004 15.3333 8.00004C15.3333 8.00004 12.6667 13.3334 8.00001 13.3334C3.33334 13.3334 0.666676 8.00004 0.666676 8.00004Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
            {state.errors?.testPassword && (
              <p className="mt-1.5 text-xs text-red-600">
                {state.errors.testPassword[0]}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
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
              {pending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // View mode
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      {/* Header with name and action buttons */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            {application.name}
          </h2>
          <a
            href={application.testUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            {application.testUrl}
            {/* External link icon */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 6.5V9.5C9 9.76522 8.89464 10.0196 8.70711 10.2071C8.51957 10.3946 8.26522 10.5 8 10.5H2.5C2.23478 10.5 1.98043 10.3946 1.79289 10.2071C1.60536 10.0196 1.5 9.76522 1.5 9.5V4C1.5 3.73478 1.60536 3.48043 1.79289 3.29289C1.98043 3.10536 2.23478 3 2.5 3H5.5"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 1.5H10.5V4.5"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 7L10.5 1.5"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEditToggle}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-dim"
          >
            {/* Pencil icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.388 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.6667L4.99967 13.6667L1.33301 14.6667L2.33301 11L11.333 2.00004Z"
                stroke="currentColor"
                strokeWidth="1.33"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            {/* Trash icon */}
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
            Delete
          </button>
        </div>
      </div>

      {/* Credentials section */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Username */}
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">
              Test Username
            </p>
            <p className="text-sm text-text-primary">{application.testUsername}</p>
          </div>

          {/* Password */}
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">
              Test Password
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-text-primary">
                {passwordVisible
                  ? application.testPassword
                  : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
              </p>
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="rounded p-0.5 text-text-muted transition-colors hover:text-text-secondary"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
              >
                {passwordVisible ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.41301 9.41337C9.23023 9.60982 9.00943 9.76747 8.76412 9.87697C8.5188 9.98647 8.25393 10.0457 7.98539 10.0512C7.71685 10.0567 7.44984 10.0082 7.20032 9.90876C6.9508 9.8093 6.72388 9.66098 6.53178 9.46888C6.33968 9.27678 6.19136 9.04986 6.0919 8.80034C5.99244 8.55082 5.94395 8.28381 5.94943 8.01527C5.95492 7.74673 6.01419 7.48186 6.12369 7.23655C6.23319 6.99123 6.39084 6.77043 6.58729 6.58765M11.96 11.96C10.8204 12.8287 9.43274 13.3099 7.99967 13.3334C3.33301 13.3334 0.666676 8.00004 0.666676 8.00004C1.49561 6.4546 2.64609 5.10445 4.03967 4.04004L11.96 11.96ZM6.59967 2.82671C7.05856 2.71935 7.5286 2.66575 8.00034 2.66671C12.667 2.66671 15.3337 8.00004 15.3337 8.00004C14.9287 8.75712 14.446 9.46989 13.893 10.1267L6.59967 2.82671Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M0.666676 0.666626L15.3333 15.3333" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.666676 8.00004C0.666676 8.00004 3.33334 2.66671 8.00001 2.66671C12.6667 2.66671 15.3333 8.00004 15.3333 8.00004C15.3333 8.00004 12.6667 13.3334 8.00001 13.3334C3.33334 13.3334 0.666676 8.00004 0.666676 8.00004Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span>Created {formattedCreated}</span>
            <span>Updated {formattedUpdated}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
