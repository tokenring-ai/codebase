import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import CodeBaseService from "../../CodeBaseService.ts";
import {buildResourceTree} from "./buildResourceTree.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

async function execute({
                         agent,
                       }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const codebaseService = agent.requireServiceByType(CodeBaseService);
  const sortedResources = codebaseService
    .getAvailableResources()
    .sort((a, b) => a.localeCompare(b));

  const selection = await agent.askQuestion({
    message: `Select resources to include in your chat context`,
    question: {
      type: "treeSelect",
      label: "Codebase Resource Selection",
      key: "result",
      defaultValue: Array.from(codebaseService.getEnabledResourceNames(agent)),
      minimumSelections: 0,
      tree: buildResourceTree(sortedResources),
    },
  });

  if (selection) {
    const enabled = codebaseService.setEnabledResources(selection, agent);
    return `Currently enabled codebase resources: ${Array.from(enabled).join(", ")}`;
  }
  return "Resource selection cancelled.";
}

export default {
  name: "codebase select",
  description: "Interactive resource selection",
  inputSchema,
  execute,
  help: `Open an interactive tree view to browse and select codebase resources. Recommended when unsure of exact resource names.

## Example

/codebase select`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
