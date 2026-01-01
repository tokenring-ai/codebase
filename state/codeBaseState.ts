import {Agent} from "@tokenring-ai/agent";
import type {ResetWhat} from "@tokenring-ai/agent/AgentEvents";
import type {AgentStateSlice} from "@tokenring-ai/agent/types";
import {z} from "zod";
import {CodeBaseServiceConfigSchema} from "../schema.ts";

export class CodeBaseState implements AgentStateSlice {
  name = "CodeBaseState";
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

  serialize(): object {
    return {
      enabledResources: Array.from(this.enabledResources)
    };
  }

  deserialize(data: any): void {
    this.enabledResources = new Set(data.enabledResources || []);
  }

  show(): string[] {
    return [
      `Enabled Resources: ${Array.from(this.enabledResources).join(", ") || "None"}`,
    ];
  }
}
