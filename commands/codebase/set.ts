import {Agent} from "@tokenring-ai/agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import CodeBaseService from "../../CodeBaseService.js";

export default {
  name: "codebase set",
  description: "/codebase set - Set enabled codebase resources",
  help: `# /codebase set <resource...>

Set the enabled codebase resources, replacing the current selection.

## Example

/codebase set src/utils
/codebase set src/utils src/types`,
  execute: async (remainder: string, agent: Agent): Promise<string> => {
    const enabled = agent.requireServiceByType(CodeBaseService).setEnabledResources(remainder.split(/\s+/).filter(Boolean), agent);
    return `Currently enabled codebase resources: ${Array.from(enabled).join(", ")}`;
  },
} satisfies TokenRingAgentCommand;
