import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import CodeBaseService from "../../CodeBaseService.js";

const inputSchema = {
  args: {},
  positionals: [
    {
      name: "resources",
      description: "Space-separated resource names to disable",
      required: true,
      greedy: true,
    }
  ],
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({positionals: {resources}, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const resourceList = resources.split(/\s+/);
  const enabled = agent.requireServiceByType(CodeBaseService).disableResources(resourceList, agent);
  return `Currently enabled codebase resources: ${Array.from(enabled).join(", ")}`;
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
