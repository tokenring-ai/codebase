import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import CodeBaseService from "../../CodeBaseService.js";

const inputSchema = {
  args: {},
  prompt: {
    description: "Space-separated resource names to set as enabled",
    required: true,
  },
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({prompt, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const enabled = agent.requireServiceByType(CodeBaseService).setEnabledResources(prompt.split(/\s+/).filter(Boolean), agent);
  return `Currently enabled codebase resources: ${Array.from(enabled).join(", ")}`;
}

export default {
  name: "codebase set",
  description: "Set enabled codebase resources",
  inputSchema,
  execute,
  help: `# /codebase set <resource...>

Set the enabled codebase resources, replacing the current selection.

## Example

/codebase set src/utils
/codebase set src/utils src/types`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
