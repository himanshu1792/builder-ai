import Link from "next/link";
import { listApplications } from "@/lib/applications";
import { listAllRepositoriesGrouped } from "@/lib/scenarios";
import { ScenarioForm } from "../components/ScenarioForm";

export default async function NewScenarioPage() {
  const [applications, repositoriesByApp] = await Promise.all([
    listApplications(),
    listAllRepositoriesGrouped(),
  ]);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/scenarios"
        className="inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
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
        Back to Scenarios
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          New Test Scenario
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Describe what you want to test in plain English.
        </p>
      </div>

      {/* Form */}
      <ScenarioForm
        applications={applications}
        repositoriesByApp={repositoriesByApp}
      />
    </div>
  );
}
