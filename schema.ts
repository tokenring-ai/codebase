import type { ConfigFieldMeta } from "@tokenring-ai/app/config/metadata";
import { FileMatchSchema } from "@tokenring-ai/filesystem/schema";
import { z } from "zod";

export const CodeBaseResourceSchema = z.object({
  type: z.union([z.literal("repoMap"), z.literal("fileTree"), z.literal("wholeFile")]).meta({
    description: "How this resource is presented to the agent",
  } satisfies ConfigFieldMeta),
  description: z
    .string()
    .optional()
    .meta({ description: "Human-readable description of this resource" } satisfies ConfigFieldMeta),
  items: z.array(FileMatchSchema).meta({ description: "File match patterns included in this resource" } satisfies ConfigFieldMeta),
});

export type ParsedCodeBaseResource = z.output<typeof CodeBaseResourceSchema>;

export const CodeBaseAgentConfigSchema = z
  .object({
    enabledResources: z.array(z.string()).exactOptional(),
  })
  .default({});

export const CodeBaseServiceConfigSchema = z
  .object({
    resources: z
      .record(z.string(), CodeBaseResourceSchema)
      .meta({ label: "Resources", description: "Named codebase resources, keyed by name" } satisfies ConfigFieldMeta),
    agentDefaults: z
      .object({
        enabledResources: z
          .array(z.string())
          .default([])
          .meta({ description: "Resources enabled by default for new agents" } satisfies ConfigFieldMeta),
      })
      .default({ enabledResources: [] })
      .meta({ label: "Agent Defaults" } satisfies ConfigFieldMeta),
  })
  .meta({ label: "Codebase", description: "Codebase indexing and context resources for agents" } satisfies ConfigFieldMeta);
