import {Agent} from "@tokenring-ai/agent";
import {FileSystemService} from "@tokenring-ai/filesystem";
import FileMatchResource from "@tokenring-ai/filesystem/FileMatchResource";
import {TokenRingService} from "@tokenring-ai/app/types";
import KeyedRegistry from "@tokenring-ai/utility/registry/KeyedRegistry";
import {createParserFactory, type LanguageEnum, parseCodeAndChunk,} from "code-chopper";
import path from "path";
import {CodeBaseAgentConfigSchema} from "./schema.ts";
import { CodeBaseState } from "./state/codeBaseState";

export default class CodeBaseService implements TokenRingService {
  name = "CodeBaseService";
  description =
    "Manages codebase resources for providing file content and directory structure to AI context, allowing selective inclusion of project files and directories.";
  resourceRegistry =
    new KeyedRegistry<FileMatchResource>();

  registerResource = this.resourceRegistry.register;
  getAvailableResources = this.resourceRegistry.getAllItemNames;

  async attach(agent: Agent): Promise<void> {
    const { enabledResources } = agent.getAgentConfigSlice('codebase', CodeBaseAgentConfigSchema);
    // The enabled resources can include wildcards, so they need to be mapped to actual tool names with ensureItemNamesLike
    agent.initializeState(CodeBaseState, {
      enabledResources: enabledResources.map(resourceName => this.resourceRegistry.ensureItemNamesLike(resourceName)).flat()
    });
  }

  getEnabledResourceNames(agent: Agent): Set<string> {
    return agent.getState(CodeBaseState).enabledResources;
  }

  getEnabledResources(agent: Agent): FileMatchResource[] {
    return Array.from(agent.getState(CodeBaseState).enabledResources).map(r => this.resourceRegistry.requireItemByName(r));
  }

  setEnabledResources(resourceNames: string[], agent: Agent): Set<string> {
    const matchedResourceNames = resourceNames.map(resourceName => this.resourceRegistry.ensureItemNamesLike(resourceName)).flat();

    return agent.mutateState(CodeBaseState, (state) => {
      state.enabledResources = new Set(matchedResourceNames);
      return state.enabledResources;
    })
  }

  enableResources(resourceNames: string[], agent: Agent): Set<string> {
    const matchedResourceNames = resourceNames.map(resourceName => this.resourceRegistry.ensureItemNamesLike(resourceName)).flat();

    return agent.mutateState(CodeBaseState, (state) => {
      for (const resourceName of matchedResourceNames) {
        state.enabledResources.add(resourceName);
      }
      return state.enabledResources;
    })
  }

  disableResources(resourceNames: string[], agent: Agent): Set<string> {
    const matchedResourceNames = resourceNames.map(resourceName => this.resourceRegistry.ensureItemNamesLike(resourceName)).flat();

    return agent.mutateState(CodeBaseState, (state) => {
      for (const resourceName of matchedResourceNames) {
        state.enabledResources.delete(resourceName);
      }
      return state.enabledResources;
    });
  }


  async generateRepoMap(
    files: Set<string>,
    fileSystem: FileSystemService,
    agent: Agent,
  ): Promise<string | null> {
    const factory = createParserFactory();
    const repoMap: string[] = [];

    for (const file of files) {
      try {
        const code = await fileSystem.getFile(file, agent);
        if (!code) continue;

        const ext = path.extname(file);
        const language = this.getLanguageFromExtension(ext);
        if (!language) continue;

        const chunks = await parseCodeAndChunk(code, language, factory, {
          filter: () => true,
        });
        const formattedOutput = this.formatFileOutput(file, chunks);
        if (formattedOutput) repoMap.push(formattedOutput);
      } catch (error) {
        agent.errorLine(
          `[CodeBaseService] Error processing file ${file}:`,
          error as Error,
        );
      }
    }

    factory.dispose();

    if (repoMap.length > 0) {
      return `// These are snippets of the symbols in the project. This DOES NOT contain the full file contents. This only includes relevant symbols for you to reference so you know what to retrieve with the retrieveFiles resource:\n${repoMap.join("\n")}`;
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
