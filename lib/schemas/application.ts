import { z } from "zod";

export const applicationSchema = z.object({
  name: z.string().min(1, { error: "Application name is required" }).max(100),
  testUrl: z.string().url({ error: "Must be a valid URL" }),
  testUsername: z.string().min(1, { error: "Username is required" }),
  testPassword: z.string().min(1, { error: "Password is required" }),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
