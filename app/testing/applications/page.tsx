import { listApplications } from "@/lib/applications";
import { ApplicationsClient } from "./components/ApplicationsClient";

export default async function ApplicationsPage() {
  const applications = await listApplications();

  return <ApplicationsClient applications={applications} />;
}
