import {Agent} from "@tokenring-ai/agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import CodeBaseService from "../../CodeBaseService.js";

export default {
  name: "codebase disable",
  description: "Disable codebase resources",
  help: `# /codebase disable <resource...>

Disable one or more codebase resources by name.

## Example

/codebase disable src/utils
/codebase disable src/utils src/types`,
  execute: async (remainder: string, agent: Agent): Promise<string> => {
    const enabled = agent.requireServiceByType(CodeBaseService).disableResources(remainder.split(/\s+/).filter(Boolean), agent);
    return `Currently enabled codebase resources: ${Array.from(enabled).join(", ")}`;
  },
} satisfies TokenRingAgentCommand;
