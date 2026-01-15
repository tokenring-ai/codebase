import Agent from "@tokenring-ai/agent/Agent";
import {ContextItem, ParsedChatConfig} from "@tokenring-ai/chat/schema";
import {FileSystemService} from "@tokenring-ai/filesystem";
import CodeBaseService from "../CodeBaseService.ts";
import RepoMapResource from "../RepoMapResource.ts";
import WholeFileResource from "../WholeFileResource.ts";

export default async function* getContextItems(input: string, chatConfig: ParsedChatConfig, params: {}, agent: Agent): AsyncGenerator<ContextItem> {
  const codebaseService = agent.requireServiceByType(CodeBaseService);
  const fileSystem = agent.requireServiceByType(FileSystemService);
  const resources = codebaseService.getEnabledResources(agent);

  // File tree
  {
    const fileTreeFiles = new Set<string>();
    for (const name in resources) {
      const resource = resources[name];
      if (
        !(resource instanceof WholeFileResource) &&
        !(resource instanceof RepoMapResource)
      ) {
        await resource.addFilesToSet(fileTreeFiles, agent);
      }
    }

    if (fileTreeFiles.size > 0) {
      yield {

        role: "user",
        content: `// Directory Tree of project files:\n${Array.from(
          fileTreeFiles,
        )
          .sort()
          .join("\n")}`,
      };
    }
  }

  // Repo map
  {
    const repoMapFiles = new Set<string>();
    for (const name in resources) {
      const resource = resources[name];
      if (resource instanceof RepoMapResource) {
        await resource.addFilesToSet(repoMapFiles, agent);
      }
    }

    if (repoMapFiles.size > 0) {
      const repoMap = await codebaseService.generateRepoMap(
        repoMapFiles,
        fileSystem,
        agent,
      );
      if (repoMap) {
        yield {

          role: "user",
          content: repoMap,
        };
      }
    }
  }

  // Whole files
  {
    const wholeFiles = new Set<string>();
    for (const name in resources) {
      const resource = resources[name];
      if (resource instanceof WholeFileResource) {
        await resource.addFilesToSet(wholeFiles, agent);
      }
    }

    for await (const file of wholeFiles) {
      const content = await fileSystem.readTextFile(file, agent);
      yield {

        role: "user",
        content: `// Complete contents of file: ${file}\n${content}`,
      };
    }
  }
}
