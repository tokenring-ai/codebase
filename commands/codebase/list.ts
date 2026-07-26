import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import numberedList from "@tokenring-ai/utility/string/numberedList";
import CodeBaseService from "../../CodeBaseService.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

function execute({ agent }: AgentCommandInputType<typeof inputSchema>): string {
  const active = agent.requireServiceByType(CodeBaseService).getEnabledResourceNames(agent);
  if (active.empty()) return "No codebase resources are currently enabled.";
  return `Enabled codebase resources:\n${numberedList(active.valuesArray())}`;
}

export default {
  name: "codebase list",
  description: "List enabled codebase resources",
  inputSchema,
  execute,
  help: `List all currently enabled codebase resources.

## Example

/codebase list`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
