"use client";

import { useState } from "react";
import type { ApplicationListItem } from "@/lib/applications";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationModal } from "./ApplicationModal";

interface ApplicationsClientProps {
  applications: ApplicationListItem[];
}

export function ApplicationsClient({
  applications,
}: ApplicationsClientProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Applications
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage the applications you want to generate tests for.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-all duration-200 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/30"
        >
          <svg
            width="16"
            height="16"
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
          Add Application
        </button>
      </div>

      {/* Content */}
      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary"
            >
              <rect
                x="4"
                y="6"
                width="24"
                height="20"
                rx="3"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M4 12H28"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="8" cy="9" r="1" fill="currentColor" />
              <circle cx="11" cy="9" r="1" fill="currentColor" />
              <circle cx="14" cy="9" r="1" fill="currentColor" />
              <path
                d="M16 18V22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M14 20H18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 className="mb-1 text-lg font-semibold text-text-primary">
            No applications registered yet
          </h2>
          <p className="mb-6 text-sm text-text-secondary">
            Add your first application to start generating tests.
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-all duration-200 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/30"
          >
            <svg
              width="16"
              height="16"
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
            Add Application
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <ApplicationModal
        mode="create"
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}
