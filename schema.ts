import {z} from "zod";

export const CodeBaseConfigSchema = z
  .object({
    resources: z.record(z.string(), z.any())
  });

export const CodeBaseAgentConfigSchema = z
  .object({
    enabledResources: z.array(z.string()).default([])
  }).default({ enabledResources: [] });