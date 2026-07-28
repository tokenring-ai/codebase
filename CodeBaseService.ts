import path from "node:path";
import type { Agent } from "@tokenring-ai/agent";
import type { TokenRingService } from "@tokenring-ai/app/types";
import type { FileSystemService } from "@tokenring-ai/filesystem";
import type FileMatchResource from "@tokenring-ai/filesystem/FileMatchResource";
import { deepEqual } from "@tokenring-ai/one-frontend/src/lib/utils";
import deepClone from "@tokenring-ai/utility/object/deepClone";
import KeyedRegistry from "@tokenring-ai/utility/registry/KeyedRegistry";
import EnhancedSet from "@tokenring-ai/utility/set/enhancedSet";
import { type BoundaryChunk, createParserFactory, type LanguageEnum, parseCodeAndChunk } from "code-chopper";
import FileTreeResource from "./FileTreeResource.ts";
import RepoMapResource from "./RepoMapResource.ts";
import { CodeBaseAgentConfigSchema, CodeBaseServiceConfigSchema, type ParsedCodeBaseResource, type ParsedCodeBaseServiceConfig } from "./schema.ts";
import { CodeBaseState } from "./state/codeBaseState";
import WholeFileResource from "./WholeFileResource.ts";

export default class CodeBaseService implements TokenRingService {
  readonly name = "CodeBaseService";
  description =
    "Manages codebase resources for providing file content and directory structure to AI context, allowing selective inclusion of project files and directories.";
  resourceRegistry = new KeyedRegistry<FileMatchResource>();

  registerResource = this.resourceRegistry.set;
  getAvailableResources = this.resourceRegistry.keysArray;

  private config = CodeBaseServiceConfigSchema.parse({});

  reconfigure(newConfig: ParsedCodeBaseServiceConfig): void {
    this.resourceRegistry.reconcileAgainst(newConfig.resources, {
      creating: (_name, resourceConfig) => this.createResource(resourceConfig),
      deleting: () => {},
      updating: (name, resource, resourceConfig) => {
        if (deepEqual(this.config.resources[name], resourceConfig)) return resource;
        return this.createResource(resourceConfig);
      },
    });
    this.config = newConfig;
  }

  private createResource(resourceConfig: ParsedCodeBaseResource): FileMatchResource {
    switch (resourceConfig.type) {
      case "fileTree":
        return new FileTreeResource(resourceConfig.items);
      case "repoMap":
        return new RepoMapResource(resourceConfig.items);
      case "wholeFile":
        return new WholeFileResource(resourceConfig.items);
    }
  }

  attach(agent: Agent): void {
    const { enabledResources } = deepClone(this.config.agentDefaults, agent.getAgentConfigSlice("codebase", CodeBaseAgentConfigSchema));
    // The enabled resources can include wildcards, so they need to be mapped to actual tool names with ensureItemNamesLike
    agent.initializeState(CodeBaseState, {
      enabledResources: enabledResources.flatMap(resourceName => this.resourceRegistry.requireKeysLike(resourceName)),
    });
  }

  getEnabledResourceNames(agent: Agent): EnhancedSet<string> {
    return agent.getState(CodeBaseState).enabledResources;
  }

  getEnabledResources(agent: Agent): FileMatchResource[] {
    return agent.getState(CodeBaseState).enabledResources.map(r => this.resourceRegistry.require(r));
  }

  setEnabledResources(resourceNames: string[], agent: Agent): EnhancedSet<string> {
    const matchedResourceNames = resourceNames.flatMap(resourceName => this.resourceRegistry.requireKeysLike(resourceName));

    return agent.mutateState(CodeBaseState, state => {
      state.enabledResources = new EnhancedSet(matchedResourceNames);
      return state.enabledResources;
    });
  }

  enableResources(resourceNames: string[], agent: Agent): EnhancedSet<string> {
    const matchedResourceNames = resourceNames.flatMap(resourceName => this.resourceRegistry.requireKeysLike(resourceName));

    return agent.mutateState(CodeBaseState, state => {
      state.enabledResources.insertAll(matchedResourceNames);
      return state.enabledResources;
    });
  }

  disableResources(resourceNames: string[], agent: Agent): EnhancedSet<string> {
    const matchedResourceNames = resourceNames.flatMap(resourceName => this.resourceRegistry.requireKeysLike(resourceName));

    return agent.mutateState(CodeBaseState, state => {
      state.enabledResources.deleteAll(matchedResourceNames);
      return state.enabledResources;
    });
  }

  async generateRepoMap(files: Iterable<string>, fileSystem: FileSystemService, agent: Agent): Promise<string | null> {
    const factory = createParserFactory();
    const repoMap: string[] = [];

    for (const file of files) {
      try {
        const code = await fileSystem.readTextFile(file, agent);
        if (!code) continue;

        const ext = path.extname(file);
        const language = this.getLanguageFromExtension(ext);
        if (!language) continue;

        const chunks = await parseCodeAndChunk(code, language, factory, {
          filter: () => true,
        });
        const formattedOutput = this.formatFileOutput(file, chunks);
        if (formattedOutput) repoMap.push(formattedOutput);
      } catch (error: unknown) {
        agent.errorMessage(`[CodeBaseService] Error processing file ${file}:`, error as Error);
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

  formatFileOutput(filePath: string, chunks: BoundaryChunk[]) {
    if (chunks.length === 0) return null;

    let output = `${filePath}:\n`;

    for (const chunk of chunks) {
      const firstLine = chunk.content.split("\n")[0]?.trim();
      if (firstLine) {
        output += `- ${firstLine}\n`;
      }
    }

    return output;
  }
}
