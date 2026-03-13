import { notFound } from "next/navigation";
import { getScenario } from "@/lib/scenarios";
import { ScenarioDetailClient } from "./components/ScenarioDetailClient";

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = await getScenario(id);
  if (!scenario) notFound();
  return <ScenarioDetailClient scenario={scenario} />;
}
