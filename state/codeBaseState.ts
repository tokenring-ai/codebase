import type { Agent } from "@tokenring-ai/agent";
import { AgentStateSlice } from "@tokenring-ai/agent/types";
import { z } from "zod";
import type { CodeBaseServiceConfigSchema } from "../schema.ts";

const serializationSchema = z
  .object({
    enabledResources: z.array(z.string()).default([]),
  })
  .prefault({});

export class CodeBaseState extends AgentStateSlice<typeof serializationSchema> {
  enabledResources: Set<string>;

  constructor(readonly initialConfig: z.output<typeof CodeBaseServiceConfigSchema>["agentDefaults"]) {
    super("CodeBaseState", serializationSchema);
    this.enabledResources = new Set(initialConfig.enabledResources);
  }

  transferStateFromParent(parent: Agent): void {
    this.enabledResources = new Set(parent.getState(CodeBaseState).enabledResources);
  }

  reset(): void {
    this.enabledResources = new Set(this.initialConfig.enabledResources);
  }

  serialize(): z.output<typeof serializationSchema> {
    return {
      enabledResources: Array.from(this.enabledResources),
    };
  }

  deserialize(data: z.output<typeof serializationSchema>): void {
    this.enabledResources = new Set(data.enabledResources);
  }

  show(): string {
    return `Enabled Resources: ${Array.from(this.enabledResources).join(", ") || "None"}`;
  }
}
