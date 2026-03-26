import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {FileSystemService} from "@tokenring-ai/filesystem";
import CodeBaseService from "../../CodeBaseService.ts";
import RepoMapResource from "../../RepoMapResource.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

async function execute({agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const codebaseService = agent.requireServiceByType(CodeBaseService);
  const repoMaps = Object.values(codebaseService.getEnabledResources(agent))
    .filter(r => r instanceof RepoMapResource);

  if (repoMaps.length === 0) return "No RepoMap resources are currently enabled. Enable a RepoMap resource first.";

  const repoMapFiles = new Set<string>();
  for (const resource of repoMaps) {
    await resource.addFilesToSet(repoMapFiles, agent);
  }

  if (repoMapFiles.size > 0) {
    const repoMap = await codebaseService.generateRepoMap(repoMapFiles, agent.requireServiceByType(FileSystemService), agent);
    if (repoMap) return `Repository map:\n${repoMap}`;
  }

  return "No repository map found. Ensure RepoMap resources are configured and enabled.";
}

export default {
  name: "codebase show repo", 
  description: "Display the repository map", 
  inputSchema,
  execute,
  help: `Display the currently enabled repository map and structure. Requires RepoMap resources to be enabled first.

## Example

/codebase show repo`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
