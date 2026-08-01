import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import CodeBaseService from "../../CodeBaseService.ts";

const inputSchema = {
  args: {},
  remainder: {
    name: "resources",
    description: "Space-separated resource names to enable",
    required: true,
  },
} as const satisfies AgentCommandInputSchema;

function execute({ remainder, agent }: AgentCommandInputType<typeof inputSchema>): string {
  const resourceList = remainder.split(/\s+/);
  const enabled = agent.requireService(CodeBaseService).enableResources(resourceList, agent);
  return `Currently enabled codebase resources: ${enabled.join(", ")}`;
}

export default {
  name: "codebase enable",
  description: "Enable codebase resources",
  inputSchema,
  execute,
  help: `Enable one or more codebase resources by name.

## Example

/codebase enable src/utils
/codebase enable api docs`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
