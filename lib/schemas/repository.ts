import { z } from "zod";

const githubUrlPattern = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;
const adoUrlPattern = /^https:\/\/(dev\.azure\.com\/[\w.-]+|[\w.-]+\.visualstudio\.com)\/[\w.-]+\/_git\/[\w.-]+\/?$/;

export const repositorySchema = z
  .object({
    provider: z.enum(["github", "ado"], { error: "Select a provider" }),
    repoUrl: z.string().url({ error: "Must be a valid URL" }),
    pat: z.string().min(1, { error: "Personal Access Token is required" }),
    // For GitHub this will be null from FormData; for ADO we enforce it via a refine below.
    organization: z.string().nullable().optional(),
    outputFolder: z.string().min(1, { error: "Output folder is required" }),
  })
  .refine(
    (data) => {
      if (data.provider === "github") return githubUrlPattern.test(data.repoUrl);
      if (data.provider === "ado") return adoUrlPattern.test(data.repoUrl);
      return false;
    },
    { message: "Invalid repository URL for the selected provider", path: ["repoUrl"] }
  )
  .refine(
    (data) => {
      if (data.provider === "ado" && (!data.organization || data.organization.trim() === "")) {
        return false;
      }
      return true;
    },
    { message: "Organization name is required for Azure DevOps", path: ["organization"] }
  );

export type RepositoryInput = z.infer<typeof repositorySchema>;
