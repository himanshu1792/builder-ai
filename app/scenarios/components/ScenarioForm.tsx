"use client";

import { useActionState, useState } from "react";
import { createScenarioAction } from "@/lib/actions/scenarios";
import type { ActionState } from "@/lib/actions/applications";
import type { ApplicationListItem } from "@/lib/applications";
import type { GroupedRepositories } from "@/lib/scenarios";

interface ScenarioFormProps {
  applications: ApplicationListItem[];
  repositoriesByApp: GroupedRepositories;
}

const initialState: ActionState = {
  success: false,
};

export function ScenarioForm({
  applications,
  repositoriesByApp,
}: ScenarioFormProps) {
  const [selectedAppId, setSelectedAppId] = useState("");
  const [state, formAction, pending] = useActionState(
    createScenarioAction,
    initialState
  );

  const filteredRepos = selectedAppId
    ? repositoriesByApp[selectedAppId] || []
    : [];

  return (
    <form action={formAction}>
      <div className="space-y-5 rounded-xl border border-border bg-surface p-6">
        {/* General error message */}
        {state.message && !state.success && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {state.message}
          </div>
        )}

        {/* Scenario Input */}
        <div>
          <label
            htmlFor="inputText"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Scenario Description
          </label>
          <textarea
            id="inputText"
            name="inputText"
            placeholder="e.g., Navigate to login page, enter valid credentials, verify dashboard loads with correct user name displayed"
            className={`h-32 w-full resize-y rounded-lg border bg-surface-inset px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 ${
              state.errors?.inputText
                ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                : "border-border focus:border-primary focus:ring-primary"
            }`}
          />
          {state.errors?.inputText && (
            <p className="mt-1 text-xs text-red-500">
              {state.errors.inputText[0]}
            </p>
          )}
        </div>

        {/* Application Select */}
        <div>
          <label
            htmlFor="applicationId"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Application
          </label>
          <select
            id="applicationId"
            name="applicationId"
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className={`w-full rounded-lg border bg-surface-inset px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 ${
              state.errors?.applicationId
                ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                : "border-border focus:border-primary focus:ring-primary"
            }`}
          >
            <option value="">Select an application...</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>
          {state.errors?.applicationId && (
            <p className="mt-1 text-xs text-red-500">
              {state.errors.applicationId[0]}
            </p>
          )}
        </div>

        {/* Repository Select */}
        <div>
          <label
            htmlFor="repositoryId"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Repository
          </label>
          <select
            id="repositoryId"
            name="repositoryId"
            key={selectedAppId}
            disabled={!selectedAppId}
            className={`w-full rounded-lg border bg-surface-inset px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
              state.errors?.repositoryId
                ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                : "border-border focus:border-primary focus:ring-primary"
            }`}
          >
            <option value="">
              {selectedAppId
                ? "Select a repository..."
                : "Select an application first"}
            </option>
            {filteredRepos.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.repoUrl}
              </option>
            ))}
          </select>
          {state.errors?.repositoryId && (
            <p className="mt-1 text-xs text-red-500">
              {state.errors.repositoryId[0]}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
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
            {pending ? "Creating..." : "Create Scenario"}
          </button>
        </div>
      </div>
    </form>
  );
}
