# @tokenring-ai/codebase

A TokenRing AI plugin for managing codebase resources and providing intelligent file context to AI agents.

## Overview

The `@tokenring-ai/codebase` package provides a comprehensive service for managing codebase resources in TokenRing AI agents. Its primary purpose is to selectively include project files, directory structures, and repository maps into the AI's context through context handlers. This enables AI agents to reason about and interact with the codebase by providing file trees, full file contents, and symbol information as needed.

## Chat Commands

The package provides a `/codebase` command for managing codebase resources in chat sessions.

### Available Actions

| Action | Description |
|--------|-------------|
| **select** | Interactive resource selection via tree view (recommended for exploring available resources) |
| **enable** | Enable specific codebase resources by name<br>Example: `/codebase enable src utils` |
| **disable** | Disable specific codebase resources<br>Example: `/codebase disable src utils` |
| **set** | Set specific codebase resources by name<br>Example: `/codebase set src utils` |
| **list** | List all currently enabled resources |
| **clear** | Remove all resources from the session |
| **show repo** | Display repository map and structure |

### Usage Examples

```bash
/codebase select        # Interactive resource selection
/codebase enable src/   # Enable resources under src/
/codebase disable test/ # Disable resources under test/
/codebase list          # Show enabled resources
/codebase clear         # Clear all resources
/codebase show repo     # Show repository structure
```

## Plugin Configuration

The plugin provides configuration through the `codebase` section of your app configuration:

```typescript
import codeBasePlugin from "@tokenring-ai/codebase";

const appConfig = {
  codebase: {
    resources: {
      "src": {
        type: "fileTree",
      },
      "docs": {
        type: "repoMap",
      },
      "config": {
        type: "wholeFile",
      },
    },
    agentDefaults: {
      enabledResources: ["src", "docs"],
    },
  },
};

app.addPlugin(codeBasePlugin, appConfig.codebase);
```

### Configuration Schema

```typescript
import { z } from "zod";

export const CodeBaseAgentConfigSchema = z
  .object({
    enabledResources: z.array(z.string()).optional()
  }).default({});

export const CodeBaseServiceConfigSchema = z
  .object({
    resources: z.record(z.string(), z.any()),
    agentDefaults: z.object({
        enabledResources: z.array(z.string()).default([])
    }).default({ enabledResources: [] })
  });
```

## Tools

The package provides tools for agent-based codebase operations. Tools are automatically registered when the service is attached to an agent.

### Available Tools

#### search_code

Search for code in the codebase.

```typescript
// Tool definition
{
  name: "search_code",
  description: "Search for code in the codebase",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query",
      },
    },
    required: ["query"],
  },
}
```

#### read_file

Read a file from the codebase.

```typescript
// Tool definition
{
  name: "read_file",
  description: "Read a file from the codebase",
  parameters: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "File path",
      },
    },
    required: ["filePath"],
  },
}
```

#### list_files

List files in a directory.

```typescript
// Tool definition
{
  name: "list_files",
  description: "List files in a directory",
  parameters: {
    type: "object",
    properties: {
      directory: {
        type: "string",
        description: "Directory",
      },
    },
    required: ["directory"],
  },
}
```

## Services

### CodeBaseService

The main service class implementing `TokenRingService`. It manages a registry of `FileMatchResource` instances and generates context items for AI agents.

```typescript
import { CodeBaseService } from "@tokenring-ai/codebase";

const codebaseService = new CodeBaseService(options);
```

**Service Properties:**

- `name`: Service identifier ("CodeBaseService")
- `description`: Service description
- `resourceRegistry`: Registry managing all FileMatchResource instances

**Resource Management Methods:**

- `registerResource(name, resource)`: Register a new resource with the service
- `getAvailableResources()`: Get all available resource names
- `getEnabledResources(agent)`: Get currently enabled resources for an agent
- `setEnabledResources(resourceNames, agent)`: Set which resources are enabled
- `enableResources(resourceNames, agent)`: Enable specific resources
- `disableResources(resourceNames, agent)`: Disable specific resources

**Repository Mapping Methods:**

- `generateRepoMap(files, fileSystem, agent)`: Generate a repository map from files
- `getLanguageFromExtension(ext)`: Map file extensions to language types
- `formatFileOutput(filePath, chunks)`: Format repository map entries

**Service Interface:**

```typescript
interface TokenRingService {
  name: string;
  description: string;
  
  async start(agent: TokenRingAgent): Promise<void>;
  async stop(): Promise<void>;
}
```

## Providers

The package includes three resource types that act as providers for different kinds of codebase information:

### FileTreeResource

Extends `FileMatchResource` from `@tokenring-ai/filesystem`. Provides directory structure context.

```typescript
import FileTreeResource from "@tokenring-ai/codebase/FileTreeResource";

class FileTreeResource extends FileMatchResource {
  name = "FileTreeService";
  description = "Provides FileTree functionality";
}
```

### RepoMapResource

Extends `FileMatchResource`. Provides symbol-level repository mapping using code-chopper.

```typescript
import RepoMapResource from "@tokenring-ai/codebase/RepoMapResource";

class RepoMapResource extends FileMatchResource {
  name = "RepoMapResource";
  description = "Provides RepoMap functionality";
}
```

### WholeFileResource

Extends `FileMatchResource`. Provides complete file contents to agent context.

```typescript
import WholeFileResource from "@tokenring-ai/codebase/WholeFileResource";

class WholeFileResource extends FileMatchResource {
  name = "WholeFileResource";
  description = "Provides whole files to include in the chat context";
}
```

## RPC Endpoints

The package does not define direct RPC endpoints. All functionality is accessed through tools and context handlers.

## State Management

State is managed through the `CodeBaseState` class implementing `AgentStateSlice`:

```typescript
import { CodeBaseState } from "@tokenring-ai/codebase";

class CodeBaseState implements AgentStateSlice {
  name = "CodeBaseState";
  enabledResources: Set<string>;
  
  constructor(initialConfig);
  transferStateFromParent(parent: Agent): void;
  reset(what: ResetWhat[]): void;
  serialize(): object;
  deserialize(data: any): void;
  show(): string[];
}
```

**State Properties:**

- `enabledResources`: Set of currently enabled resource names

**State Methods:**

- `serialize()`: Convert state to JSON-serializable format
- `deserialize(data)`: Restore state from serialized data
- `show()`: Generate human-readable state representation

**State Initialization:**

The state is initialized during agent attachment:

```typescript
async attach(agent: Agent): Promise<void> {
  const { enabledResources } = deepMerge(
    this.options.agentDefaults, 
    agent.getAgentConfigSlice('codebase', CodeBaseAgentConfigSchema)
  );
  
  agent.initializeState(CodeBaseState, {
    enabledResources: enabledResources.map(resourceName => 
      this.resourceRegistry.ensureItemNamesLike(resourceName)
    ).flat()
  });
}
```

## Context Handlers

The package provides context handlers for integrating with the chat system:

```typescript
import { codeBaseContext } from "@tokenring-ai/codebase/contextHandlers";
```

### codebase-context

The main context handler provides automatic context injection to agents:

```typescript
import codebaseContext from "@tokenring-ai/codebase/contextHandlers/codebaseContext";

export default async function* getContextItems(
  input: string, 
  chatConfig: ChatConfig, 
  params: {}, 
  agent: Agent
): AsyncGenerator<ContextItem> {
  // 1. File tree context from FileTree resources
  // 2. Repository map from RepoMap resources  
  // 3. Whole file contents from WholeFile resources
}
```

**Context Generation:**

The context handler generates three types of context items:

1. **File Tree**: Directory structure of enabled file tree resources
2. **Repo Map**: Symbol-level documentation from enabled repo map resources
3. **Whole Files**: Complete file contents from enabled whole file resources

## Installation

```bash
bun add @tokenring-ai/codebase
```

## Usage Examples

### Basic Setup

```typescript
import TokenRingApp from "@tokenring-ai/app";
import codeBasePlugin from "@tokenring-ai/codebase";

const app = new TokenRingApp({
  config: {
    codebase: {
      resources: {
        "src": { type: "fileTree" },
        "api": { type: "repoMap" },
        "config": { type: "wholeFile" }
      },
      agentDefaults: {
        enabledResources: ["src", "api"]
      }
    }
  }
});

app.addPlugin(codeBasePlugin, appConfig.codebase);
```

### Manual Service Usage

```typescript
import { CodeBaseService } from "@tokenring-ai/codebase";
import { FileSystemService } from "@tokenring-ai/filesystem";
import { Agent } from "@tokenring-ai/agent";

// Create and configure service
const codebaseService = new CodeBaseService({
  resources: {
    "src": { type: "fileTree" },
    "api": { type: "repoMap" }
  },
  agentDefaults: {
    enabledResources: ["src", "api"]
  }
});

// Register resources
codebaseService.registerResource("src", new FileTreeResource({}));
codebaseService.registerResource("api", new RepoMapResource({}));

// Generate repository map
const agent = new Agent(/* config */);
const fileSystem = new FileSystemService();
const files = new Set(["src/main.ts", "src/utils.ts"]);
const repoMap = await codebaseService.generateRepoMap(files, fileSystem, agent);
```

### Multi-language Repository Mapping

The service automatically detects file types and generates appropriate repository maps:

```typescript
// Supported language mappings
getLanguageFromExtension(".js")   // "javascript"
getLanguageFromExtension(".ts")   // "typescript" 
getLanguageFromExtension(".tsx")  // "typescript"
getLanguageFromExtension(".py")   // "python"
getLanguageFromExtension(".h")    // "c"
getLanguageFromExtension(".c")    // "c"
getLanguageFromExtension(".hxx")  // "cpp"
getLanguageFromExtension(".cxx")  // "cpp"
getLanguageFromExtension(".hpp")  // "cpp"
getLanguageFromExtension(".cpp")  // "cpp"
getLanguageFromExtension(".rs")   // "rust"
getLanguageFromExtension(".go")   // "go"
getLanguageFromExtension(".java") // "java"
getLanguageFromExtension(".rb")   // "ruby"
getLanguageFromExtension(".sh")   // "bash"
getLanguageFromExtension(".bash") // "bash"
```

## Development

### Building

```bash
bun run build
```

### Testing

Uses Vitest for testing:

```bash
bun run test
```

## License

MIT License - see [LICENSE](./LICENSE) file for details.
