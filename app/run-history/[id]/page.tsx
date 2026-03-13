import { notFound } from "next/navigation";
import { getScenario } from "@/lib/scenarios";
import { RunDetailClient } from "./components/RunDetailClient";

interface RunDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { id } = await params;
  const scenario = await getScenario(id);

  if (!scenario) {
    notFound();
  }

  return <RunDetailClient scenario={scenario} />;
}
