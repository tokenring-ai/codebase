import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import CodeBaseService from "../../CodeBaseService.js";

const inputSchema = {
  args: {},
  prompt: {
    description: "Space-separated resource names to enable",
    required: true,
  },
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({prompt, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const enabled = agent.requireServiceByType(CodeBaseService).enableResources(prompt.split(/\s+/).filter(Boolean), agent);
  return `Currently enabled codebase resources: ${Array.from(enabled).join(", ")}`;
}

export default {
  name: "codebase enable",
  description: "Enable codebase resources",
  inputSchema,
  execute,
  help: `# /codebase enable <resource...>

Enable one or more codebase resources by name.

## Example

/codebase enable src/utils
/codebase enable api docs`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
