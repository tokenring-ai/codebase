import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/types";
import {z} from "zod";
import CodeBaseService from "../CodeBaseService.js";

const name = "codebase/listResources";

async function execute(
  {},
  agent: Agent,
): Promise<{
  ok: boolean;
  availableResources: string[];
  activeResources: string[];
  error?: string;
}> {
  const codebaseService = agent.requireServiceByType(CodeBaseService);

  return {
    ok: true,
    availableResources: codebaseService.getAvailableResources(),
    activeResources: Array.from(codebaseService.getActiveResourceNames()),
  };
}

const description =
  "Lists all available and currently active codebase resources.";

const inputSchema = z.object({});

export default {
  name, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
