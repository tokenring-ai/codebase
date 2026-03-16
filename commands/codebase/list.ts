import {Agent} from "@tokenring-ai/agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import numberedList from "@tokenring-ai/utility/string/numberedList";
import CodeBaseService from "../../CodeBaseService.js";

export default {
  name: "codebase list",
  description: "List enabled codebase resources",
  help: `# /codebase list

List all currently enabled codebase resources.

## Example

/codebase list`,
  execute: async (_remainder: string, agent: Agent): Promise<string> => {
    const active = Array.from(agent.requireServiceByType(CodeBaseService).getEnabledResourceNames(agent));
    if (active.length === 0) return "No codebase resources are currently enabled.";
    return `Enabled codebase resources:\n${numberedList(active)}`;
  },
} satisfies TokenRingAgentCommand;
