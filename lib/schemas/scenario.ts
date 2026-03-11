import { z } from "zod";

export const scenarioSchema = z.object({
  inputText: z
    .string()
    .min(10, { error: "Scenario must be at least 10 characters" })
    .max(5000, { error: "Scenario must be under 5000 characters" }),
  applicationId: z
    .string()
    .min(1, { error: "Please select an application" }),
  repositoryId: z
    .string()
    .min(1, { error: "Please select a repository" }),
});

export type ScenarioInput = z.infer<typeof scenarioSchema>;
