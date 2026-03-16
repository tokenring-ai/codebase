import {Agent} from "@tokenring-ai/agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {FileSystemService} from "@tokenring-ai/filesystem";
import CodeBaseService from "../../CodeBaseService.js";
import RepoMapResource from "../../RepoMapResource.ts";

async function execute(_remainder: string, agent: Agent): Promise<string> {
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
  name: "codebase show repo", description: "Display the repository map", help: `# /codebase show repo

Display the currently enabled repository map and structure. Requires RepoMap resources to be enabled first.

## Example

/codebase show repo`, execute } satisfies TokenRingAgentCommand;
