import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {CodeBaseState} from "../../state/codeBaseState.ts";

const inputSchema = {
  args: {},
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const enabled = agent.mutateState(CodeBaseState, state => {
    state.reset();
    return state.enabledResources;
  })
  return `Currently enabled codebase resources: ${Array.from(enabled).join(", ")}`;
}

export default {
  name: "codebase reset",
  description: "Reset enabled codebase resources",
  inputSchema,
  execute,
  help: `# /codebase reset

Reset the enabled codebase resources to the initial configuration.

## Example

/codebase reset`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
