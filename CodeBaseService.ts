import {Registry, Service} from "@token-ring/registry";
import FileTreeResource from "./FileTreeResource.ts";
import {FileSystemService} from "@token-ring/filesystem";
import WholeFileResource from "./WholeFileResource.ts";

export type MemoryItem = { role: string; content: string };

export default class CodeBaseService extends Service {
  /**
   * Asynchronously yields memories from file tree and whole files
   */
  async *getMemories(registry: Registry): AsyncGenerator<MemoryItem> {
    const fileTreeFiles = new Set<string>();

    const fileTreeResources = registry.resources.getResourcesByType(
      FileTreeResource
    ) as Array<InstanceType<typeof FileTreeResource>>;
    for (const resource of fileTreeResources) {
      await (resource as any).addFilesToSet(fileTreeFiles, registry);
    }

    if (fileTreeFiles.size > 0) {
      yield {
        role: "user",
        content: `// Directory Tree of project files:\n${Array.from(fileTreeFiles)
          .sort()
          .join("\n")}`,
      };
    }

    const wholeFiles = new Set<string>();

    const wholeFileResources = registry.resources.getResourcesByType(
      WholeFileResource
    ) as Array<InstanceType<typeof WholeFileResource>>;
    for (const resource of wholeFileResources) {
      await (resource as any).addFilesToSet(wholeFiles, registry);

      for await (const file of (resource as any).getMatchedFiles(registry)) {
        wholeFiles.add(file as string);
      }
    }

    const fileSystem = registry.requireFirstServiceByType(
      FileSystemService
    ) as any;
    for await (const file of wholeFiles) {
      const content = await fileSystem.getFile(file);
      yield {
        role: "user",
        content: `// Complete contents of file: ${file}\n${content}`,
      };
    }
  }
}
