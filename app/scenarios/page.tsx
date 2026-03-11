import Link from "next/link";
import { listScenarios } from "@/lib/scenarios";
import { ScenarioList } from "./components/ScenarioList";

export default async function ScenariosPage() {
  const scenarios = await listScenarios();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Test Scenarios
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Browse past scenarios and their generation status.
          </p>
        </div>
        <Link
          href="/scenarios/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-all duration-200 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/30"
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
          New Scenario
        </Link>
      </div>

      {/* Scenario List */}
      <ScenarioList scenarios={scenarios} />
    </div>
  );
}
