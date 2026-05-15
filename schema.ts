import { z } from "zod";

export const FileMatchSchema = z.object({
  path: z.string(),
  include: z.string().exactOptional(),
  exclude: z.string().exactOptional()
});

export type ParsedFileMatch = z.output<typeof FileMatchSchema>

export const CodeBaseResourceSchema = z.object({
  type: z.union([
    z.literal('repoMap'),
    z.literal('fileTree'),
    z.literal('wholeFile'),
  ]),
  description: z.string().optional(),
  items: z.array(FileMatchSchema),
});

export type ParsedCodeBaseResource = z.output<typeof CodeBaseResourceSchema>


export const CodeBaseAgentConfigSchema = z
  .object({
    enabledResources: z.array(z.string()).exactOptional(),
  })
  .default({});

export const CodeBaseServiceConfigSchema = z.object({
  resources: z.record(z.string(), CodeBaseResourceSchema),
  agentDefaults: z
    .object({
      enabledResources: z.array(z.string()).default([]),
    })
    .default({ enabledResources: [] }),
});
