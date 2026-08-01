import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import CodeBaseService from "../../CodeBaseService.ts";

const inputSchema = {
  args: {},
  remainder: {
    name: "resources",
    description: "Space-separated resource names to disable",
    required: true,
  },
} as const satisfies AgentCommandInputSchema;

function execute({ remainder, agent }: AgentCommandInputType<typeof inputSchema>): string {
  const resourceList = remainder.split(/\s+/);
  const enabled = agent.requireService(CodeBaseService).disableResources(resourceList, agent);
  return `Currently enabled codebase resources: ${enabled.join(", ")}`;
}

export default {
  name: "codebase disable",
  description: "Disable codebase resources",
  inputSchema,
  execute,
  help: `Disable one or more codebase resources by name.

## Example

/codebase disable src/utils
/codebase disable src/utils src/types`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
