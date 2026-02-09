import {Agent} from "@tokenring-ai/agent";
import type {ResetWhat} from "@tokenring-ai/agent/AgentEvents";
import type {AgentStateSlice} from "@tokenring-ai/agent/types";
import {z} from "zod";
import {CodeBaseServiceConfigSchema} from "../schema.ts";

const serializationSchema = z.object({
  enabledResources: z.array(z.string()).default([])
}).prefault({});

export class CodeBaseState implements AgentStateSlice<typeof serializationSchema> {
  readonly name = "CodeBaseState";
  serializationSchema = serializationSchema;
  enabledResources = new Set<string>([]);
  constructor(readonly initialConfig: z.output<typeof CodeBaseServiceConfigSchema>["agentDefaults"]) {
    for (const resource of initialConfig.enabledResources) {
      this.enabledResources.add(resource);
    }
  }

  transferStateFromParent(parent: Agent): void {
    for (const resource of parent.getState(CodeBaseState).enabledResources) {
      this.enabledResources.add(resource);
    }
  }

  reset(what: ResetWhat[]): void {
  }

  serialize(): z.output<typeof serializationSchema> {
    return {
      enabledResources: Array.from(this.enabledResources)
    };
  }

  deserialize(data: z.output<typeof serializationSchema>): void {
    this.enabledResources = new Set(data.enabledResources);
  }

  show(): string[] {
    return [
      `Enabled Resources: ${Array.from(this.enabledResources).join(", ") || "None"}`,
    ];
  }
}
