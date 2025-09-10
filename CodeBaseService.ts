import {Agent} from "@tokenring-ai/agent";
import {MemoryItemMessage, TokenRingService} from "@tokenring-ai/agent/types";
import {FileSystemService} from "@tokenring-ai/filesystem";
import FileMatchResource from "@tokenring-ai/filesystem/FileMatchResource";
import KeyedRegistryWithMultipleSelection from "@tokenring-ai/utility/KeyedRegistryWithMultipleSelection";
import WholeFileResource from "./WholeFileResource.ts";

export default class CodeBaseService implements TokenRingService {
  name = "CodeBaseService";
  description = "Manages codebase resources for providing file content and directory structure to AI context, allowing selective inclusion of project files and directories.";
  private resourceRegistry = new KeyedRegistryWithMultipleSelection<FileMatchResource>();

  registerResource = this.resourceRegistry.register;
  getActiveResourceNames = this.resourceRegistry.getActiveItemNames;
  enableResources = this.resourceRegistry.enableItems;
  getAvailableResources = this.resourceRegistry.getAllItemNames;

  /**
   * Asynchronously yields memories from file tree and whole files
   */
  async* getMemories(agent: Agent): AsyncGenerator<MemoryItemMessage> {
    {
      const fileTreeFiles = new Set<string>();
      const resources = this.resourceRegistry.getActiveItemEntries();
      for (const name in resources) {
        const resource = resources[name];

        await resource.addFilesToSet(fileTreeFiles, agent);
      }

      if (fileTreeFiles.size > 0) {
        yield {
          role: "user",
          content: `// Directory Tree of project files:\n${Array.from(fileTreeFiles)
            .sort()
            .join("\n")}`,
        };
      }
    }

    {
      const wholeFiles = new Set<string>();
      const resources = this.resourceRegistry.getActiveItemEntries();
      for (const name in resources) {
        const resource = resources[name];

        if (resource instanceof WholeFileResource) {
          await resource.addFilesToSet(wholeFiles, agent);
        }
      }

      const fileSystem = agent.requireFirstServiceByType(
        FileSystemService
      );
      for await (const file of wholeFiles) {
        const content = await fileSystem.getFile(file);
        yield {
          role: "user",
          content: `// Complete contents of file: ${file}\n${content}`,
        };
      }
    }
  }
}
