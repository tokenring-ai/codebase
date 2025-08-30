import {FileSystemService} from "@token-ring/filesystem";
import FileMatchResource from "@token-ring/filesystem/FileMatchResource";
import {Registry, Service} from "@token-ring/registry";
import {MemoryItemMessage} from "@token-ring/registry/Service";
import GenericMultipleRegistry from "@token-ring/utility/GenericMultipleRegistry";
import WholeFileResource from "./WholeFileResource.ts";

export default class CodeBaseService extends Service {
  private resourceRegistry = new GenericMultipleRegistry<FileMatchResource>();

  registerResource = this.resourceRegistry.register;
  getActiveResourceNames = this.resourceRegistry.getActiveItemNames;
  enableResources = this.resourceRegistry.enableItem;
  getAvailableResources = this.resourceRegistry.getAllItemNames;

  /**
   * Asynchronously yields memories from file tree and whole files
   */
  async* getMemories(registry: Registry): AsyncGenerator<MemoryItemMessage> {
    {
      const fileTreeFiles = new Set<string>();
      const resources = this.resourceRegistry.getActiveItemEntries();
      for (const name in resources) {
        const resource = resources[name];

        await resource.addFilesToSet(fileTreeFiles, registry);
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
          await resource.addFilesToSet(wholeFiles, registry);
        }
      }

      const fileSystem = registry.requireFirstServiceByType(
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
