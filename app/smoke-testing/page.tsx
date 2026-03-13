import { listApplications } from "@/lib/applications";
import { listAllRepositoriesGrouped } from "@/lib/scenarios";
import { SmokeTestClient } from "./components/SmokeTestClient";

export default async function SmokeTestingPage() {
  const [applications, repositoriesByApp] = await Promise.all([
    listApplications(),
    listAllRepositoriesGrouped(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Smoke Testing</h1>
        <p className="mt-1 text-sm text-text-muted">
          Describe your test scenario and watch AI agents generate a Playwright script and open a PR.
        </p>
      </div>

      {/* Main Content */}
      <SmokeTestClient
        applications={applications}
        repositoriesByApp={repositoriesByApp}
      />
    </div>
  );
}
