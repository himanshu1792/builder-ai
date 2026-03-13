import { notFound } from "next/navigation";
import { getApplication } from "@/lib/applications";
import { listRepositories } from "@/lib/repositories";
import { AppDetailClient } from "./components/AppDetailClient";

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();
  const repositories = await listRepositories(id);
  return <AppDetailClient application={application} repositories={repositories} />;
}
