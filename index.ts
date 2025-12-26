import {z} from "zod";

export const CodeBaseConfigSchema = z
  .object({
    resources: z.record(z.string(), z.any()),
    defaultResources: z.array(z.string()).default([]),
  })
  .optional();



export {default as FileTreeResource} from "./FileTreeResource.ts";
export {default as RepoMapResource} from "./RepoMapResource.ts";
export {default as WholeFileResource} from "./WholeFileResource.ts";
export {default as CodeBaseService} from "./CodeBaseService.ts";
