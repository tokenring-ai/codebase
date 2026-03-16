import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import CodeBaseService from "../../CodeBaseService.js";

const inputSchema = {
  args: {},
  prompt: {
    description: "Space-separated resource names to disable",
    required: true,
  },
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({prompt, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const enabled = agent.requireServiceByType(CodeBaseService).disableResources(prompt.split(/\s+/).filter(Boolean), agent);
  return `Currently enabled codebase resources: ${Array.from(enabled).join(", ")}`;
}

export default {
  name: "codebase disable",
  description: "Disable codebase resources",
  inputSchema,
  execute,
  help: `# /codebase disable <resource...>

Disable one or more codebase resources by name.

## Example

/codebase disable src/utils
/codebase disable src/utils src/types`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
