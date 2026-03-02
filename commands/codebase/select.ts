import {Agent} from "@tokenring-ai/agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import CodeBaseService from "../../CodeBaseService.js";
import {buildResourceTree} from "./buildResourceTree.ts";

async function execute(remainder: string, agent: Agent): Promise<string> {
  const codebaseService = agent.requireServiceByType(CodeBaseService);
  const sortedResources = codebaseService.getAvailableResources().sort((a, b) => a.localeCompare(b));

  const selection = await agent.askQuestion({
    message: `Select resources to include in your chat context`,
    question: {
      type: 'treeSelect',
      label: "Codebase Resource Selection",
      key: "result",
      defaultValue: Array.from(codebaseService.getEnabledResourceNames(agent)),
      minimumSelections: 0,
      tree: buildResourceTree(sortedResources),
    }
  });

  if (selection) {
    const enabled = codebaseService.setEnabledResources(selection, agent);
    return `Currently enabled codebase resources: ${Array.from(enabled).join(", ")}`;
  }
  return "Resource selection cancelled.";
}

export default { name: "codebase select", description: "/codebase select - Interactive resource selection", help: `# /codebase select

Open an interactive tree view to browse and select codebase resources. Recommended when unsure of exact resource names.

## Example

/codebase select`, execute } satisfies TokenRingAgentCommand;
