"use client";

import { useState } from "react";
import type { ApplicationListItem } from "@/lib/applications";
import type { GroupedRepositories } from "@/lib/scenarios";

interface RegressionTestFormProps {
  applications: ApplicationListItem[];
  repositoriesByApp: GroupedRepositories;
  onSubmit: (data: { targetUrl: string; applicationId: string; repositoryId: string }) => void;
  disabled: boolean;
}

export function RegressionTestForm({
  applications,
  repositoriesByApp,
  onSubmit,
  disabled,
}: RegressionTestFormProps) {
  const [selectedAppId, setSelectedAppId] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [repositoryId, setRepositoryId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredRepos = selectedAppId
    ? repositoriesByApp[selectedAppId] || []
    : [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!targetUrl.trim()) {
      newErrors.targetUrl = "Target URL is required.";
    } else {
      try {
        new URL(targetUrl.trim());
      } catch {
        newErrors.targetUrl = "Please enter a valid URL.";
      }
    }
    if (!selectedAppId) {
      newErrors.applicationId = "Select an application.";
    }
    if (!repositoryId) {
      newErrors.repositoryId = "Select a repository.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({ targetUrl: targetUrl.trim(), applicationId: selectedAppId, repositoryId });
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col rounded-xl border border-border bg-surface">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/10">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-teal-600">
            <path d="M7 1.75V12.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M11.25 5.25L7 1.75L2.75 5.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.75 8.75H11.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-sm font-medium text-text-primary">Configuration</span>
      </div>

      <div className="flex-1 space-y-4 p-4">
        {/* Application Select */}
        <div>
          <label htmlFor="rt-applicationId" className="mb-1.5 block text-sm font-medium text-text-primary">
            Application
          </label>
          <select
            id="rt-applicationId"
            value={selectedAppId}
            onChange={(e) => {
              setSelectedAppId(e.target.value);
              setRepositoryId("");
            }}
            disabled={disabled}
            className={`w-full rounded-lg border bg-surface-inset px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
              errors.applicationId
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
          {errors.applicationId && (
            <p className="mt-1 text-xs text-red-500">{errors.applicationId}</p>
          )}
        </div>

        {/* Repository Select */}
        <div>
          <label htmlFor="rt-repositoryId" className="mb-1.5 block text-sm font-medium text-text-primary">
            Repository
          </label>
          <select
            id="rt-repositoryId"
            value={repositoryId}
            onChange={(e) => setRepositoryId(e.target.value)}
            disabled={disabled || !selectedAppId}
            className={`w-full rounded-lg border bg-surface-inset px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
              errors.repositoryId
                ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                : "border-border focus:border-primary focus:ring-primary"
            }`}
          >
            <option value="">
              {selectedAppId ? "Select a repository..." : "Select an application first"}
            </option>
            {filteredRepos.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.repoUrl}
              </option>
            ))}
          </select>
          {errors.repositoryId && (
            <p className="mt-1 text-xs text-red-500">{errors.repositoryId}</p>
          )}
        </div>

        {/* Target URL Input */}
        <div>
          <label htmlFor="rt-targetUrl" className="mb-1.5 block text-sm font-medium text-text-primary">
            Target URL
          </label>
          <input
            id="rt-targetUrl"
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            disabled={disabled}
            placeholder="https://myapp.com/dashboard"
            className={`w-full rounded-lg border bg-surface-inset px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
              errors.targetUrl
                ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                : "border-border focus:border-primary focus:ring-primary"
            }`}
          />
          <p className="mt-1 text-xs text-text-muted">
            The Planner will explore this page and discover all testable scenarios.
          </p>
          {errors.targetUrl && (
            <p className="mt-1 text-xs text-red-500">{errors.targetUrl}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-all duration-200 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {disabled ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Pipeline Running...
              </span>
            ) : (
              "Start Exploration"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
