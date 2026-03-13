import { listApplications } from "@/lib/applications";
import { listAllRepositoriesGrouped } from "@/lib/scenarios";
import { RegressionTestClient } from "./components/RegressionTestClient";

export default async function RegressionTestingPage() {
  const [applications, repositoriesByApp] = await Promise.all([
    listApplications(),
    listAllRepositoriesGrouped(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Regression Testing</h1>
        <p className="mt-1 text-sm text-text-muted">
          Provide a URL to explore. The Planner agent will discover test scenarios, generate a test plan, and create a PR with Playwright scripts.
        </p>
      </div>

      {/* Main Content */}
      <RegressionTestClient
        applications={applications}
        repositoriesByApp={repositoriesByApp}
      />
    </div>
  );
}
