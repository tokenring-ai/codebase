# @tokenring-ai/codebase

## Overview

The `@tokenring-ai/codebase` package provides a service for managing codebase resources in TokenRing AI agents. Its primary purpose is to selectively include project files, directory structures, and repository maps into the agent's context through context handlers. This enables AI agents to reason about and interact with the codebase by providing file trees, full file contents, and symbol information as needed.

### Key Features

- **Multiple Resource Types**: File trees, repository maps, and whole file contents
- **Interactive Management**: `/codebase` commands for resource selection and management
- **State Management**: Persistent resource enablement across agent sessions
- **Wildcard Support**: Pattern matching for resource selection (e.g., `src/*`)
- **Multi-language Repository Mapping**: Automatic detection and symbol extraction for 15+ programming languages
- **Context Injection**: Automatic codebase context in chat sessions
- **Symbol-Level Repository Mapping**: Uses code-chopper to parse source files and extract symbol definitions for repository map generation

## Installation

```bash
bun add @tokenring-ai/codebase
```

## Plugin Configuration

The plugin provides configuration through the `codebase` section of your app configuration:

```typescript
import codeBasePlugin from "@tokenring-ai/codebase";
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp({
  config: {
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
        enabledResources: [],
      },
    },
  },
});

app.install(codeBasePlugin, {
  codebase: {
    resources: {
      "src": { type: "fileTree" },
      "docs": { type: "repoMap" },
      "config": { type: "wholeFile" }
    },
    agentDefaults: {
      enabledResources: []
    }
  }
});
```

### Configuration Schema

```typescript
import { z } from "zod";

export const CodeBaseAgentConfigSchema = z
  .object({
    enabledResources: z.array(z.string()).optional()
  }).default({ enabledResources: [] });

export const CodeBaseServiceConfigSchema = z
  .object({
    resources: z.record(z.string(), z.any()),
    agentDefaults: z.object({
      enabledResources: z.array(z.string()).default([])
    }).default({ enabledResources: [] })
  });
```

## Agent Configuration

When the codebase plugin is installed, agents can be configured with specific resource settings:

```typescript
agent.configure({
  codebase: {
    enabledResources: ["src", "api"]
  }
});
```

### Agent Configuration Schema

```typescript
import { z } from "zod";

export const CodeBaseAgentConfigSchema = z
  .object({
    enabledResources: z.array(z.string()).optional()
  }).default({});
```

## Chat Commands

The package provides a comprehensive set of chat commands for managing codebase resources:

### /codebase

Manage codebase resources in the chat session.

**Usage:** `/codebase [action] [resources...]`

**Available Commands:**

| Command | Description |
|---------|-------------|
| **select** | Interactive resource selection via tree view (recommended for exploring available resources)<br>Example: `/codebase select` |
| **enable** | Enable specific codebase resources by name<br>Example: `/codebase enable src/utils src/types` |
| **disable** | Disable specific codebase resources<br>Example: `/codebase disable src/utils` |
| **set** | Set specific codebase resources by name (replaces current selection)<br>Example: `/codebase set src/utils src/types` |
| **reset** | Reset enabled codebase resources to the initial configuration<br>Example: `/codebase reset` |
| **list** | List all currently enabled codebase resources<br>Example: `/codebase list` |
| **show repo** | Display the currently enabled repository map and structure<br>Example: `/codebase show repo` |

**Examples:**

- `/codebase select` - Browse and select resources interactively
- `/codebase set src/docs` - Set specific codebase resources by name
- `/codebase enable src/*` - Enable all resources under src/ directory
- `/codebase enable api docs` - Enable specific resources by name
- `/codebase disable src/*` - Disable specific resources by name
- `/codebase list` - Show currently enabled resources
- `/codebase reset` - Reset to initial configuration
- `/codebase show repo` - View repository structure and symbols

## Services

### CodeBaseService

The main service class implementing `TokenRingService`. It manages a registry of `FileMatchResource` instances and generates context items for AI agents.

```typescript
import CodeBaseService from "@tokenring-ai/codebase";

const codebaseService = new CodeBaseService(options);
```

**Service Properties:**

- `name`: Service identifier ("CodeBaseService")
- `description`: Service description
- `resourceRegistry`: Registry managing all FileMatchResource instances
- `options`: Service configuration options

**Resource Management Methods:**

```typescript
// Returns all registered resource names
getAvailableResources(): string[]

// Returns the names of currently enabled resources
getEnabledResourceNames(
  agent: Agent
): Set<string>

// Returns the currently enabled FileMatchResource instances
getEnabledResources(
  agent: Agent
): FileMatchResource[]

// Sets enabled resources (replaces current selection)
setEnabledResources(
  resourceNames: string[],
  agent: Agent
): Set<string>

// Enables specific resources (adds to current selection)
enableResources(
  resourceNames: string[],
  agent: Agent
): Set<string>

// Disables specific resources (removes from current selection)
disableResources(
  resourceNames: string[],
  agent: Agent
): Set<string>
```

**Repository Mapping Methods:**

```typescript
// Generates repository map from files using code-chopper
async generateRepoMap(
  files: Set<string>,
  fileSystem: FileSystemService,
  agent: Agent
): Promise<string | null>

// Maps file extension to language type for code-chopper
getLanguageFromExtension(
  ext: string
): LanguageEnum | null

// Formats repository map output from code chunks
formatFileOutput(
  filePath: string,
  chunks: any[]
): string | null
```

**Method Descriptions:**

- `registerResource(name, resource)`: Registers a new resource with the service's internal KeyedRegistry
- `getAvailableResources()`: Returns all registered resource names as a sorted array
- `getEnabledResourceNames(agent)`: Returns a Set of currently enabled resource names from agent state
- `getEnabledResources(agent)`: Returns an array of enabled FileMatchResource instances
- `setEnabledResources(resourceNames, agent)`: Sets enabled resources, replacing current selection; handles wildcards via ensureItemNamesLike()
- `enableResources(resourceNames, agent)`: Enables specific resources, adding to current selection; handles wildcards
- `disableResources(resourceNames, agent)`: Disables specific resources, removing from current selection; handles wildcards
- `generateRepoMap(files, fileSystem, agent)`: Generates repository map by parsing files with code-chopper and extracting symbols
- `getLanguageFromExtension(ext)`: Maps file extensions to code-chopper language types (supports 15+ languages)
- `formatFileOutput(filePath, chunks)`: Formats repository map entries by extracting first line from each chunk

**Service Interface:**

```typescript
interface TokenRingService {
  name: string;
  description: string;
  readonly options: z.output<typeof CodeBaseServiceConfigSchema>;

  attach(agent: Agent): void;
}
```

**Agent Attachment:**

When an agent attaches to the CodeBaseService, the configuration is merged from:
1. Service defaults from `agentDefaults`
2. Agent-specific configuration from `agent.getAgentConfigSlice('codebase', CodeBaseAgentConfigSchema)`

The result determines which resources are enabled for that agent. The service uses `ensureItemNamesLike` to handle wildcard patterns in resource names.

## Providers

The package includes three resource types that extend `FileMatchResource` from `@tokenring-ai/filesystem`. These resources are registered with the `CodeBaseService` and can be enabled/disabled via agent state or chat commands.

### FileTreeResource

Extends `FileMatchResource`. Provides directory structure and file tree context for enabled resources. When enabled, includes a list of file paths in the agent's context.

```typescript
import FileTreeResource from "@tokenring-ai/codebase/FileTreeResource";

const fileTreeResource = new FileTreeResource(config);
```

**Resource Properties:**

- `name`: Resource identifier ("FileTreeService")
- `description`: Resource description ("Provides FileTree functionality")
- Extends `FileMatchResource` from `@tokenring-ai/filesystem`
- **Usage**: Provides directory tree of matching files in context

### RepoMapResource

Extends `FileMatchResource`. Provides symbol-level repository mapping using code-chopper. When enabled, parses source files and extracts symbol definitions to create a repository map.

```typescript
import RepoMapResource from "@tokenring-ai/codebase/RepoMapResource";

const repoMapResource = new RepoMapResource(config);
```

**Resource Properties:**

- `name`: Resource identifier ("RepoMapResource")
- `description`: Resource description ("Provides RepoMap functionality")
- Extends `FileMatchResource` from `@tokenring-ai/filesystem`
- **Usage**: Provides symbol-level documentation of code structure
- **Processing**: Uses code-chopper to parse and extract symbols from source files

### WholeFileResource

Extends `FileMatchResource`. Provides complete file contents to agent context. When enabled, includes full file contents in the agent's context.

```typescript
import WholeFileResource from "@tokenring-ai/codebase/WholeFileResource";

const wholeFileResource = new WholeFileResource(config);
```

**Resource Properties:**

- `name`: Resource identifier ("WholeFileResource")
- `description`: Resource description ("Provides whole files to include in the chat context")
- Extends `FileMatchResource` from `@tokenring-ai/filesystem`
- **Usage**: Includes complete file contents in context

## RPC Endpoints

The package does not define any RPC endpoints.

## State Management

State is managed through the `CodeBaseState` class which extends `AgentStateSlice`. The state is stored in the agent and persists across sessions.

```typescript
import { AgentStateSlice } from "@tokenring-ai/agent/types";
import { z } from "zod";

const serializationSchema = z.object({
  enabledResources: z.array(z.string()).default([])
}).prefault({});

export class CodeBaseState extends AgentStateSlice<typeof serializationSchema> {
  readonly name = "CodeBaseState";
  serializationSchema = serializationSchema;
  enabledResources: Set<string>;

  constructor(readonly initialConfig: z.output<typeof CodeBaseServiceConfigSchema>["agentDefaults"])
  
  transferStateFromParent(parent: Agent): void;
  reset(): void;
  serialize(): z.output<typeof serializationSchema>;
  deserialize(data: z.output<typeof serializationSchema>): void;
  show(): string[];
}
```

**State Schema:**

```typescript
const serializationSchema = z.object({
  enabledResources: z.array(z.string()).default([])
}).prefault({});
```

**State Features:**

- **enabledResources**: Set of currently enabled resource names (converted from array during construction)
- **State Transfer**: Resources are transferred from parent agents when cloning via `transferStateFromParent()`
- **Serialization**: Resources are serialized as an array for persistence
- **Reset**: Resources can be reset to initial configuration via `reset()`
- **UI Representation**: `show()` method returns human-readable list of enabled resources

The enabled resource names are stored as a Set internally but serialized as an array. During agent attachment, resource names can include wildcards which are mapped to actual resource names via `ensureItemNamesLike()` from the resource registry.

**State Methods:**

- `constructor(initialConfig)`: Initializes state with enabledResources from initialConfig, converting array to Set
- `transferStateFromParent(parent)`: Transfers enabled resources from a parent agent when cloning
- `reset()`: Resets enabled resources to the initial configuration
- `serialize()`: Serializes the state for persistence, converting Set to array
- `deserialize(data)`: Deserializes state from persisted data, converting array to Set
- `show()`: Returns a human-readable list of enabled resources

## Context Handlers

The package provides context handlers for integrating with the chat system. The context handler is registered with the `ChatService` during plugin installation.

```typescript
import contextHandlers from "@tokenring-ai/codebase/contextHandlers";
```

### codebase-context

The main context handler provides automatic context injection to agents by generating context items based on currently enabled resources:

```typescript
import codebaseContext from "@tokenring-ai/codebase/contextHandlers/codebaseContext";

export default async function* getContextItems(
  { agent }: ContextHandlerOptions
): AsyncGenerator<ContextItem>
```

**Context Generation:**

The context handler generates three types of context items in order:

1. **File Tree**: Directory structure of enabled file tree resources
   - Includes resources that are NOT instances of `WholeFileResource` or `RepoMapResource`
   - Uses `addFilesToSet()` to collect file paths from each resource
   - Yields a single context item with sorted file paths

2. **Repo Map**: Symbol-level documentation from enabled repo map resources
   - Includes only resources that are instances of `RepoMapResource`
   - Uses `code-chopper` to parse files and extract symbol definitions
   - Generates human-readable symbol documentation with file paths
   - Yields a single context item with the repository map

3. **Whole Files**: Complete file contents from enabled whole file resources
   - Includes only resources that are instances of `WholeFileResource`
   - Reads full file contents via `FileSystemService`
   - Yields one context item per file with complete contents

**Example Context Items:**

```typescript
// File tree context item
{
  role: "user",
  content: `// Directory Tree of project files:\nsrc/index.ts\nsrc/utils.ts`
}

// Repo map context item
{
  role: "user",
  content: `// These are snippets of the symbols in the project. This DOES NOT contain the full file contents...\nsrc/index.ts:\n- export function main()`
}

// Whole file context item
{
  role: "user",
  content: `// Complete contents of file: src/index.ts\nimport { Agent } from "@tokenring-ai/agent";\n...`
}
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
        enabledResources: []
      }
    }
  }
});

app.install(codeBasePlugin, {
  codebase: {
    resources: {
      "src": { type: "fileTree" },
      "api": { type: "repoMap" }
    },
    agentDefaults: {
      enabledResources: []
    }
  }
});
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
    enabledResources: []
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
codebaseService.getLanguageFromExtension(".js")   // "javascript"
codebaseService.getLanguageFromExtension(".ts")   // "typescript"
codebaseService.getLanguageFromExtension(".tsx")  // "typescript"
codebaseService.getLanguageFromExtension(".py")   // "python"
codebaseService.getLanguageFromExtension(".h")    // "c"
codebaseService.getLanguageFromExtension(".c")    // "c"
codebaseService.getLanguageFromExtension(".hxx")  // "cpp"
codebaseService.getLanguageFromExtension(".cxx")  // "cpp"
codebaseService.getLanguageFromExtension(".hpp")  // "cpp"
codebaseService.getLanguageFromExtension(".cpp")  // "cpp"
codebaseService.getLanguageFromExtension(".rs")   // "rust"
codebaseService.getLanguageFromExtension(".go")   // "go"
codebaseService.getLanguageFromExtension(".java") // "java"
codebaseService.getLanguageFromExtension(".rb")   // "ruby"
codebaseService.getLanguageFromExtension(".sh")   // "bash"
codebaseService.getLanguageFromExtension(".bash") // "bash"
```

### Managing Resources

The service manages enabled resources through agent state:

```typescript
// Get enabled resource names
const names = codebaseService.getEnabledResourceNames(agent);

// Get enabled resource instances
const resources = codebaseService.getEnabledResources(agent);

// Set enabled resources (mutates state, replaces current selection)
const updated = codebaseService.setEnabledResources(["src", "api"], agent);

// Enable resources (mutates state, adds to current selection)
const added = codebaseService.enableResources(["doc"], agent);

// Disable resources (mutates state, removes from current selection)
const removed = codebaseService.disableResources(["src"], agent);
```

### Using Chat Commands

```typescript
// Select resources interactively
await agent.executeChatCommand("/codebase select");

// Enable specific resources
await agent.executeChatCommand("/codebase enable src docs");

// List currently enabled resources
await agent.executeChatCommand("/codebase list");

// Reset to initial configuration
await agent.executeChatCommand("/codebase reset");

// Show repository map
await agent.executeChatCommand("/codebase show repo");
```

### Interactive Resource Selection

The `/codebase select` command uses a tree view for interactive selection. The `buildResourceTree` function organizes resources by category:

```typescript
// The buildResourceTree function organizes resources by category
// Resources are grouped by their path prefix (everything before the last slash)
import { buildResourceTree } from "@tokenring-ai/codebase/commands/codebase/buildResourceTree";

const resources = ["src/utils", "src/types", "api/handlers", "docs/readme"];
const tree = buildResourceTree(resources);

// Result:
[
  {
    name: "src",
    children: [
      { name: "utils", value: "src/utils" },
      { name: "types", value: "src/types" }
    ]
  },
  {
    name: "api",
    children: [
      { name: "handlers", value: "api/handlers" }
    ]
  },
  {
    name: "docs",
    children: [
      { name: "readme", value: "docs/readme" }
    ]
  }
]

// Resources without a path prefix are grouped under "Unknown"
const resources2 = ["utils", "types", "api/handlers"];
const tree2 = buildResourceTree(resources2);
// Result includes "Unknown" category for "utils" and "types""
```

## Plugin Architecture

The plugin orchestrates the entire codebase integration:

### Installation

The plugin's `install()` method performs these operations:

1. Registers context handlers with `ChatService`
2. Registers agent commands with `AgentCommandService`
3. Creates `CodeBaseService` instance
4. Registers configured resources by type:
   - `fileTree`: Creates `FileTreeResource`
   - `repoMap`: Creates `RepoMapResource`
   - `wholeFile`: Creates `WholeFileResource`

### Registration Pattern

Resources are registered with the service and automatically managed through agent state:

```typescript
// Plugin installs the service and resources
app.install(plugin, {
  codebase: {
    resources: {
      name: { type: "fileTree" | "repoMap" | "wholeFile" }
    },
    agentDefaults: { enabledResources: [...] }
  }
});

// Service attaches to agents and initializes state
service.attach(agent);
```

## Package Structure

```
pkg/codebase/
├── commands/
│   └── codebase/
│       ├── buildResourceTree.ts   # Tree building for interactive selection
│       ├── disable.ts             # /codebase disable command
│       ├── enable.ts              # /codebase enable command
│       ├── list.ts                # /codebase list command
│       ├── reset.ts               # /codebase reset command
│       ├── select.ts              # /codebase select command
│       ├── set.ts                 # /codebase set command
│       └── showRepo.ts            # /codebase show repo command
├── contextHandlers/
│   └── codebaseContext.ts        # Context handler for chat integration
├── state/
│   └── codeBaseState.ts          # Agent state management
├── CodeBaseService.ts            # Main service implementation
├── FileTreeResource.ts           # File tree resource provider
├── RepoMapResource.ts            # Repository map resource provider
├── WholeFileResource.ts          # Whole file resource provider
├── commands.ts                   # Chat command exports (barrel)
├── contextHandlers.ts            # Context handler exports (barrel)
├── plugin.ts                     # Plugin registration and installation
├── index.ts                      # Public API exports
├── schema.ts                     # Configuration schemas
├── package.json                  # Package metadata
├── vitest.config.ts             # Test configuration
├── LICENSE                       # License file
└── README.md                     # This file
```

## Dependencies

This package depends on:

### Runtime Dependencies

- `@tokenring-ai/agent` (0.2.0) - Central orchestration system for agent management
- `@tokenring-ai/app` (0.2.0) - Base application framework with plugin architecture
- `@tokenring-ai/chat` (0.2.0) - Chat service and context handlers
- `@tokenring-ai/filesystem` (0.2.0) - File system operations and FileMatchResource base class
- `@tokenring-ai/utility` (0.2.0) - Shared utilities including KeyedRegistry and deepMerge
- `code-chopper` (^0.1.8) - Code parsing and symbol extraction library
- `zod` (^4.3.6) - Schema validation and type inference

### Dev Dependencies

- `vitest` (^4.1.1) - Testing framework
- `typescript` (^6.0.2) - TypeScript compiler

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

### Testing Watch Mode

```bash
bun run test:watch
```

### Testing Coverage

```bash
bun run test:coverage
```

## License

MIT License - see [LICENSE](./LICENSE) file for details.
