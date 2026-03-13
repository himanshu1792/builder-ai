import { z } from "zod";

export const regressionSchema = z.object({
  targetUrl: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .min(1, { error: "Target URL is required" }),
  applicationId: z
    .string()
    .min(1, { error: "Please select an application" }),
  repositoryId: z
    .string()
    .min(1, { error: "Please select a repository" }),
});

export type RegressionInput = z.infer<typeof regressionSchema>;
