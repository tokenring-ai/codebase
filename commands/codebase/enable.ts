import {Agent} from "@tokenring-ai/agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import CodeBaseService from "../../CodeBaseService.js";

export default {
  name: "codebase enable",
  description: "Enable codebase resources",
  help: `# /codebase enable <resource...>

Enable one or more codebase resources by name.

## Example

/codebase enable src/utils
/codebase enable api docs`,
  execute: async (remainder: string, agent: Agent): Promise<string> => {
    const enabled = agent.requireServiceByType(CodeBaseService).enableResources(remainder.split(/\s+/).filter(Boolean), agent);
    return `Currently enabled codebase resources: ${Array.from(enabled).join(", ")}`;
  },
} satisfies TokenRingAgentCommand;
