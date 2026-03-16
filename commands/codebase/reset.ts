import {Agent} from "@tokenring-ai/agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {CodeBaseState} from "../../state/codeBaseState.ts";

export default {
  name: "codebase reset",
  description: "Reset enabled codebase resources",
  help: `# /codebase reset

Reset the enabled codebase resources to the initial configuration.

## Example

/codebase reset`,
  execute: async (remainder: string, agent: Agent): Promise<string> => {
    const enabled = agent.mutateState(CodeBaseState, state => {
      state.reset();
      return state.enabledResources;
    })
    return `Currently enabled codebase resources: ${Array.from(enabled).join(", ")}`;
  },
} satisfies TokenRingAgentCommand;
