import type { Agent } from "@tokenring-ai/agent";
import { AgentStateSlice } from "@tokenring-ai/agent/types";
import EnhancedSet from "@tokenring-ai/utility/set/enhancedSet";
import { z } from "zod";
import type { CodeBaseServiceConfigSchema } from "../schema.ts";

const serializationSchema = z
  .object({
    enabledResources: z.array(z.string()).default([]),
  })
  .prefault({});

export class CodeBaseState extends AgentStateSlice<typeof serializationSchema> {
  enabledResources: EnhancedSet<string>;

  constructor(readonly initialConfig: z.output<typeof CodeBaseServiceConfigSchema>["agentDefaults"]) {
    super("CodeBaseState", serializationSchema);
    this.enabledResources = new EnhancedSet(initialConfig.enabledResources);
  }

  transferStateFromParent(parent: Agent): void {
    this.enabledResources = parent.getState(CodeBaseState).enabledResources.clone();
  }

  reset(): void {
    this.enabledResources = new EnhancedSet(this.initialConfig.enabledResources);
  }

  serialize(): z.output<typeof serializationSchema> {
    return {
      enabledResources: this.enabledResources.valuesArray(),
    };
  }

  deserialize(data: z.output<typeof serializationSchema>): void {
    this.enabledResources = new EnhancedSet(data.enabledResources);
  }

  show(): string {
    return `Enabled Resources: ${this.enabledResources.join(", ") || "None"}`;
  }
}
