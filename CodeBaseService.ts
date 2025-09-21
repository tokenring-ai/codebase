import {Agent} from "@tokenring-ai/agent";
import {MemoryItemMessage, TokenRingService} from "@tokenring-ai/agent/types";
import {FileSystemService} from "@tokenring-ai/filesystem";
import FileMatchResource from "@tokenring-ai/filesystem/FileMatchResource";
import KeyedRegistryWithMultipleSelection from "@tokenring-ai/utility/KeyedRegistryWithMultipleSelection";
import {createParserFactory, LanguageEnum, parseCodeAndChunk} from "code-chopper";
import path from "path";
import RepoMapResource from "./RepoMapResource.ts";
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
   * Asynchronously yields memories from file tree, whole files, and repo map
   */
  async* getMemories(agent: Agent): AsyncGenerator<MemoryItemMessage> {
    const fileSystem = agent.requireFirstServiceByType(FileSystemService);
    const resources = this.resourceRegistry.getActiveItemEntries();

    // File tree
    {
      const fileTreeFiles = new Set<string>();
      for (const name in resources) {
        const resource = resources[name];
        if (!(resource instanceof WholeFileResource) && !(resource instanceof RepoMapResource)) {
          await resource.addFilesToSet(fileTreeFiles, agent);
        }
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
        const repoMap = await this.generateRepoMap(repoMapFiles, fileSystem, agent);
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
        const content = await fileSystem.getFile(file);
        yield {
          role: "user",
          content: `// Complete contents of file: ${file}\n${content}`,
        };
      }
    }
  }

  async generateRepoMap(files: Set<string>, fileSystem: FileSystemService, agent: Agent): Promise<string | null> {
    const factory = createParserFactory();
    const repoMap: string[] = [];

    for (const file of files) {
      try {
        const code = await fileSystem.getFile(file);
        if (!code) continue;

        const ext = path.extname(file);
        const language = this.getLanguageFromExtension(ext);
        if (!language) continue;

        const chunks = await parseCodeAndChunk(code, language, factory, { filter: () => true });
        const formattedOutput = this.formatFileOutput(file, chunks);
        if (formattedOutput) repoMap.push(formattedOutput);
      } catch (error) {
        agent.errorLine(`[CodeBaseService] Error processing file ${file}:`, error as Error);
      }
    }

    factory.dispose();

    if (repoMap.length > 0) {
      return `// These are snippets of the symbols in the project. This DOES NOT contain the full file contents. This only includes relevant symbols for you to reference so you know what to retrieve with the retrieveFiles tool:\n${repoMap.join("\n")}`;
    }
    return null;
  }

  getLanguageFromExtension(ext: string): LanguageEnum | null {
    switch (ext) {
      case ".js":
      case ".jsx":
        return "javascript";
      case ".ts":
      case ".tsx":
        return "typescript";
      case ".py":
        return "python";
      case ".h":
      case ".c":
        return "c";
      case ".hxx":
      case ".cxx":
      case ".hpp":
      case ".cpp":
        return "cpp";
      case ".rs":
        return "rust";
      case ".go":
        return "go";
      case ".java":
        return "java";
      case ".rb":
        return "ruby";
      case ".sh":
      case ".bash":
        return "bash";
      default:
        return null;
    }
  }

  formatFileOutput(filePath: string, chunks: any[]) {
    if (chunks.length === 0) return null;

    let output = `${filePath}:\n`;
    
    for (const chunk of chunks) {
      const firstLine = chunk.content.split("\n")[0].trim();
      if (firstLine) {
        output += `- ${firstLine}\n`;
      }
    }

    return output;
  }
}
