import {z} from "zod";
import Agent from "@tokenring-ai/agent/Agent";
import CodeBaseService from "../CodeBaseService.js";

export const name = "codebase/listResources";

export async function execute({}, agent: Agent): Promise<{
  ok: boolean;
  availableResources: string[];
  activeResources: string[];
  error?: string;
}> {
  const codebaseService = agent.requireFirstServiceByType(CodeBaseService);
  
  return {
    ok: true,
    availableResources: codebaseService.getAvailableResources(),
    activeResources: Array.from(codebaseService.getActiveResourceNames()),
  };
}

export const description = "Lists all available and currently active codebase resources.";

export const inputSchema = z.object({});