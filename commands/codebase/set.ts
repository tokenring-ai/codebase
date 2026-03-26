import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import CodeBaseService from "../../CodeBaseService.ts";

const inputSchema = {
  args: {},
  remainder: {
    name: "resources",
    description: "Space-separated resource names to set as enabled",
    required: true,
  }
} as const satisfies AgentCommandInputSchema;

async function execute({remainder, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const resourceList = remainder.split(/\s+/);
  const enabled = agent.requireServiceByType(CodeBaseService).setEnabledResources(resourceList, agent);
  return `Currently enabled codebase resources: ${Array.from(enabled).join(", ")}`;
}

export default {
  name: "codebase set",
  description: "Set enabled codebase resources",
  inputSchema,
  execute,
  help: `Set the enabled codebase resources, replacing the current selection.

## Example

/codebase set src/utils
/codebase set src/utils src/types`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
