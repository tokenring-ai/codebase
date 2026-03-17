import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import CodeBaseService from "../../CodeBaseService.js";

const inputSchema = {
  args: {},
  positionals: [
    {
      name: "resources",
      description: "Space-separated resource names to enable",
      required: true,
      greedy: true,
    }
  ],
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({positionals: {resources}, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const resourceList = resources.split(/\s+/)
  const enabled = agent.requireServiceByType(CodeBaseService).enableResources(resourceList, agent);
  return `Currently enabled codebase resources: ${Array.from(enabled).join(", ")}`;
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
