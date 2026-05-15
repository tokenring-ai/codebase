# @tokenring-ai/codebase

## Overview

The `@tokenring-ai/codebase` package provides a service for managing codebase resources in TokenRing AI agents. Its primary purpose is to selectively include project files, directory structures, and repository maps into the agent's context through context handlers.

This enables AI agents to reason about and interact with the codebase by providing file trees, full file contents, and symbol information as needed.

### Key Features

- **Multiple Resource Types**: File trees, repository maps, and whole files
- **Interactive Management**: Agent commands for resource selection
- **State Management**: Persistent resource enablement across sessions
- **Wildcard Support**: Pattern matching for resource selection
- **Multi-language Repository Mapping**: Symbol extraction for 10+ languages
- **Context Injection**: Automatic codebase context in chat sessions
- **Symbol-Level Mapping**: Uses code-chopper for symbol extraction

## Installation

```bash
bun add @tokenring-ai/codebase
```

## Plugin Configuration

The plugin provides configuration through the `codebase` section of your app configuration:

```typescript
import codeBasePlugin from "@tokenring-ai/codebase/plugin";
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
    enabledResources: z.array(z.string()).exactOptional(),
  })
  .default({});

export const CodeBaseServiceConfigSchema = z.object({
  resources: z.record(z.string(), z.any()),
  agentDefaults: z
    .object({
      enabledResources: z.array(z.string()).default([]),
    })
    .default({ enabledResources: [] }),
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

The agent configuration is merged with service defaults using `deepMerge` from `@tokenring-ai/utility`.

## Chat Commands

The package provides a comprehensive set of agent commands for managing codebase resources. These commands are available in the agent chat interface.

### Available Commands

| Command              | Description                                         |
|:---------------------|:----------------------------------------------------|
| `codebase select`    | Interactive resource selection via tree view        |
| `codebase enable`    | Enable specific resources (adds to selection)       |
| `codebase disable`   | Disable specific resources (removes from selection) |
| `codebase set`       | Set resources (replaces current selection)          |
| `codebase reset`     | Reset to initial configuration                      |
| `codebase list`      | List currently enabled resources                    |
| `codebase show repo` | Display repository map and structure                |

### Command Usage

All commands are invoked through the agent chat interface using the command name followed by arguments where applicable.

**Examples:**

```text
# Browse and select resources interactively via tree view
/codebase select

# Set specific codebase resources by name (replaces selection)
/codebase set src docs

# Enable specific resources by name (adds to selection)
/codebase enable api docs

# Disable specific resources
/codebase disable src/utils

# Show currently enabled resources
/codebase list

# Reset to initial configuration
/codebase reset

# View repository structure and symbols
/codebase show repo
```

### Command Details

#### codebase select

Open an interactive tree view to browse and select codebase resources. Recommended when unsure of exact resource names.

**Usage:** `/codebase select`

This command presents a tree-select interface organized by directory categories. Resources without a path prefix (no slash) are grouped under "Unknown".

#### codebase enable

Enable one or more codebase resources by name. Adds resources to the current selection.

**Usage:** `/codebase enable <resource1> [resource2] ...`

**Examples:**

```text
/codebase enable src/utils
/codebase enable api docs
```

#### codebase disable

Disable one or more codebase resources by name. Removes resources from the current selection.

**Usage:** `/codebase disable <resource1> [resource2] ...`

**Examples:**

```text
/codebase disable src/utils
/codebase disable src/utils src/types
```

#### codebase set

Set the enabled codebase resources, replacing the current selection.

**Usage:** `/codebase set <resource1> [resource2] ...`

**Examples:**

```text
/codebase set src/utils
/codebase set src/utils src/types
```

#### codebase reset

Reset the enabled codebase resources to the initial configuration defined in `agentDefaults`.

**Usage:** `/codebase reset`

#### codebase list

List all currently enabled codebase resources.

**Usage:** `/codebase list`

Returns a numbered list of enabled resources, or a message if no resources are enabled.

#### codebase show repo

Display the currently enabled repository map and structure. Requires RepoMap resources to be enabled first.

**Usage:** `/codebase show repo`

Generates and displays the repository map from all enabled RepoMap resources using code-chopper for symbol extraction.

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
- `resourceRegistry`: `KeyedRegistry<FileMatchResource>` managing resources
- `options`: Service configuration options from `CodeBaseServiceConfigSchema`

**Constructor:**

```typescript
constructor(readonly options: z.output<typeof CodeBaseServiceConfigSchema>)
```

**Service Methods:**

```typescript
// Registers a new resource with the service's internal KeyedRegistry
registerResource(name: string, resource: FileMatchResource): void

// Returns all registered resource names as a sorted array
getAvailableResources(): string[]

// Returns the names of currently enabled resources from agent state
getEnabledResourceNames(agent: Agent): Set<string>

// Returns the currently enabled FileMatchResource instances
getEnabledResources(agent: Agent): FileMatchResource[]

// Sets enabled resources (replaces current selection); handles wildcards
setEnabledResources(resourceNames: string[], agent: Agent): Set<string>

// Enables specific resources (adds to current selection); handles wildcards
enableResources(resourceNames: string[], agent: Agent): Set<string>

// Disables specific resources (removes from current selection); handles wildcards
disableResources(resourceNames: string[], agent: Agent): Set<string>

// Generates repository map from files using code-chopper
async generateRepoMap(
  files: Set<string>,
  fileSystem: FileSystemService,
  agent: Agent
): Promise<string | null>

// Maps file extension to language type for code-chopper
getLanguageFromExtension(ext: string): LanguageEnum | null

// Formats repository map output from code chunks
formatFileOutput(filePath: string, chunks: any[]): string | null
```

**Method Descriptions:**

- `registerResource(name, resource)`: Registers a new resource with the service's internal `KeyedRegistry`; assigns `register` method from registry
- `getAvailableResources()`: Returns all registered resource names as a sorted array; assigns `keysArray` from registry
- `getEnabledResourceNames(agent)`: Returns a `Set` of currently enabled resource names from agent state via `CodeBaseState`
- `getEnabledResources(agent)`: Returns an array of enabled `FileMatchResource` instances by resolving names from registry
- `setEnabledResources(resourceNames, agent)`: Sets enabled resources, replacing current selection; handles wildcards via `requireKeysLike()`
- `enableResources(resourceNames, agent)`: Enables specific resources, adding to current selection; handles wildcards
- `disableResources(resourceNames, agent)`: Disables specific resources, removing from current selection; handles wildcards
- `generateRepoMap(files, fileSystem, agent)`: Generates repository map by parsing files with code-chopper and extracting symbol definitions
- `getLanguageFromExtension(ext)`: Maps file extensions to code-chopper language types
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
2. Agent-specific configuration from `agent.getAgentConfigSlice("codebase", CodeBaseAgentConfigSchema)`

The merged configuration determines which resources are enabled for that agent. The service uses `requireKeysLike()` from the `KeyedRegistry` to handle wildcard patterns in resource names, mapping them to actual registered resource names.

## Providers

The package includes three resource types that extend `FileMatchResource` from `@tokenring-ai/filesystem`. These resources are registered with the `CodeBaseService` and can be enabled/disabled via agent state or commands.

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
- **Methods**: Inherits `addFilesToSet()` from `FileMatchResource`

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
- **Processing**: Uses code-chopper to parse and extract symbols
- **Methods**: Inherits `addFilesToSet()` from `FileMatchResource`

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
- **Methods**: Inherits `addFilesToSet()` from `FileMatchResource`

## State Management

State is managed through the `CodeBaseState` class which extends `AgentStateSlice`. The state is stored in the agent and persists across sessions.

```typescript
import { AgentStateSlice } from "@tokenring-ai/agent/types";
import { z } from "zod";

const serializationSchema = z
  .object({
    enabledResources: z.array(z.string()).default([]),
  })
  .prefault({});

export class CodeBaseState extends AgentStateSlice<typeof serializationSchema> {
  enabledResources: Set<string>;

  constructor(readonly initialConfig: z.output<typeof CodeBaseServiceConfigSchema>["agentDefaults"]);

  transferStateFromParent(parent: Agent): void;
  reset(): void;
  serialize(): z.output<typeof serializationSchema>;
  deserialize(data: z.output<typeof serializationSchema>): void;
  show(): string;
}
```

**State Schema:**

```typescript
const serializationSchema = z
  .object({
    enabledResources: z.array(z.string()).default([]),
  })
  .prefault({});
```

**State Features:**

- **enabledResources**: Set of currently enabled resource names
- **State Transfer**: Resources transferred from parent agents when cloning
- **Serialization**: Resources serialized as an array for persistence
- **Reset**: Resources can be reset to initial configuration via `reset()`
- **UI Representation**: `show()` method returns human-readable list

The enabled resource names are stored as a Set internally but serialized as an array. During agent attachment, resource names can include wildcards which are mapped to actual resource names via `requireKeysLike()` from the resource registry.

**State Methods:**

- `constructor(initialConfig)`: Initializes state with `enabledResources` from `initialConfig`, converting array to `Set`
- `transferStateFromParent(parent)`: Transfers enabled resources from a parent agent when cloning (e.g., during agent team operations)
- `reset()`: Resets enabled resources to the initial configuration from `initialConfig`
- `serialize()`: Serializes the state for persistence, converting `Set` to array
- `deserialize(data)`: Deserializes state from persisted data, converting array to `Set`
- `show()`: Returns a human-readable list of enabled resources as a string

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
   - Uses `addFilesToSet()` from each resource to collect matching file paths
   - Yields a single context item with sorted file paths

2. **Repo Map**: Symbol-level documentation from enabled repo map resources

   - Includes only resources that are instances of `RepoMapResource`
   - Collects file paths via `addFilesToSet()` then calls `generateRepoMap()`
   - Uses `code-chopper` to parse files and extract symbol definitions
   - Generates human-readable symbol documentation with file paths
   - Yields a single context item with the repository map

3. **Whole Files**: Complete file contents from enabled whole file resources

   - Includes only resources that are instances of `WholeFileResource`
   - Collects file paths via `addFilesToSet()` then reads each file
   - Reads full file contents via `FileSystemService.readTextFile()`
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
  content: `// These are snippets of the symbols in the project. This DOES NOT contain the full file contents. This only includes relevant symbols for you to reference so you know what to retrieve with the retrieveFiles resource:\nsrc/index.ts:\n- export function main()`
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
import codeBasePlugin from "@tokenring-ai/codebase/plugin";

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

The service automatically detects file types and generates appropriate repository maps using `code-chopper`:

```typescript
// Supported language mappings
codebaseService.getLanguageFromExtension(".js")    // "javascript"
codebaseService.getLanguageFromExtension(".jsx")   // "javascript"
codebaseService.getLanguageFromExtension(".ts")    // "typescript"
codebaseService.getLanguageFromExtension(".tsx")   // "typescript"
codebaseService.getLanguageFromExtension(".py")    // "python"
codebaseService.getLanguageFromExtension(".h")     // "c"
codebaseService.getLanguageFromExtension(".c")     // "c"
codebaseService.getLanguageFromExtension(".hxx")   // "cpp"
codebaseService.getLanguageFromExtension(".cxx")   // "cpp"
codebaseService.getLanguageFromExtension(".hpp")   // "cpp"
codebaseService.getLanguageFromExtension(".cpp")   // "cpp"
codebaseService.getLanguageFromExtension(".rs")    // "rust"
codebaseService.getLanguageFromExtension(".go")    // "go"
codebaseService.getLanguageFromExtension(".java")  // "java"
codebaseService.getLanguageFromExtension(".rb")    // "ruby"
codebaseService.getLanguageFromExtension(".sh")    // "bash"
codebaseService.getLanguageFromExtension(".bash")  // "bash"
```

Unsupported file extensions return `null` and are skipped during repository map generation.

### Managing Resources

The service manages enabled resources through agent state:

```typescript
// Get enabled resource names (returns Set<string>)
const names = codebaseService.getEnabledResourceNames(agent);

// Get enabled resource instances (returns FileMatchResource[])
const resources = codebaseService.getEnabledResources(agent);

// Set enabled resources (mutates state, replaces current selection)
const updated = codebaseService.setEnabledResources(["src", "api"], agent);

// Enable resources (mutates state, adds to current selection)
const added = codebaseService.enableResources(["doc"], agent);

// Disable resources (mutates state, removes from current selection)
const removed = codebaseService.disableResources(["src"], agent);

// Handle wildcard patterns (e.g., "src/*" matches all resources under src/)
const wildcardMatched = codebaseService.enableResources(["src/*"], agent);
```

All resource management methods handle wildcard patterns via `requireKeysLike()` from the `KeyedRegistry`, which expands patterns like `src/*` to match all registered resource names starting with `src/`.

### Using Commands

```typescript
// Select resources interactively
await agent.executeChatCommand("codebase select");

// Enable specific resources
await agent.executeChatCommand("codebase enable src docs");

// List currently enabled resources
await agent.executeChatCommand("codebase list");

// Reset to initial configuration
await agent.executeChatCommand("codebase reset");

// Show repository map
await agent.executeChatCommand("codebase show repo");
```

### Interactive Resource Selection

The `codebase select` command uses a tree view for interactive selection. The `buildResourceTree` function organizes resources by category:

```typescript
// The buildResourceTree function organizes resources by category
// Resources are grouped by their path prefix (directory name)
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

// Resources without a path prefix (no slash) are grouped under "Unknown"
const resources2 = ["utils", "types", "api/handlers"];
const tree2 = buildResourceTree(resources2);
// Result:
[
  {
    name: "Unknown",
    children: [
      { name: "utils", value: "utils" },
      { name: "types", value: "types" }
    ]
  },
  {
    name: "api",
    children: [
      { name: "handlers", value: "api/handlers" }
    ]
  }
]
```

The tree structure is used by the `treeSelect` question type in the agent's interactive prompt, allowing users to navigate and select resources hierarchically.

## Plugin Architecture

The plugin orchestrates the entire codebase integration:

### Plugin Installation

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

```text
pkg/codebase/
├── commands/
│   └── codebase/
│       ├── buildResourceTree.ts   # Tree building for interactive selection
│       ├── disable.ts             # codebase disable command
│       ├── enable.ts              # codebase enable command
│       ├── list.ts                # codebase list command
│       ├── reset.ts               # codebase reset command
│       ├── select.ts              # codebase select command
│       ├── set.ts                 # codebase set command
│       └── showRepo.ts            # codebase show repo command
├── contextHandlers/
│   └── codebaseContext.ts        # Context handler for chat integration
├── state/
│   └── codeBaseState.ts          # Agent state management
├── CodeBaseService.ts            # Main service implementation
├── FileTreeResource.ts           # File tree resource provider
├── RepoMapResource.ts            # Repository map resource provider
├── WholeFileResource.ts          # Whole file resource provider
├── commands.ts                   # Command exports (barrel file)
├── contextHandlers.ts            # Context handler exports (barrel file)
├── index.ts                      # Public API exports
├── plugin.ts                     # Plugin registration and installation
├── schema.ts                     # Configuration schemas
├── package.json                  # Package metadata
├── vitest.config.ts             # Test configuration
├── LICENSE                       # License file
└── README.md                     # This file
```

## Public API Exports

The package uses the following export pattern in `package.json`:

```json
{
  "exports": {
    ".": "./index.ts",
    "./*": "./*.ts"
  }
}
```

This allows importing from the main entry point or directly from any `.ts` file in the package root.

### Main Entry Point (`@tokenring-ai/codebase`)

The package exports the following via `index.ts`:

```typescript
// Resource types
export { default as FileTreeResource } from "./FileTreeResource.ts";
export { default as RepoMapResource } from "./RepoMapResource.ts";
export { default as WholeFileResource } from "./WholeFileResource.ts";

// Main service
export { default as CodeBaseService } from "./CodeBaseService.ts";
```

### Direct File Imports

You can also import directly from specific files:

```typescript
// Plugin
import codeBasePlugin from "@tokenring-ai/codebase/plugin";

// Configuration schemas
import { CodeBaseServiceConfigSchema, CodeBaseAgentConfigSchema } from "@tokenring-ai/codebase/schema";

// Context handlers
import contextHandlers from "@tokenring-ai/codebase/contextHandlers";

// Commands
import agentCommands from "@tokenring-ai/codebase/commands";

// State management
import { CodeBaseState } from "@tokenring-ai/codebase/state/codeBaseState";

// Utility functions
import { buildResourceTree } from "@tokenring-ai/codebase/commands/codebase/buildResourceTree";
```

## Dependencies

This package depends on:

### Runtime Dependencies

- `@tokenring-ai/agent` (workspace:*) - Central orchestration system for agent management
- `@tokenring-ai/app` (workspace:*) - Base application framework with plugin architecture
- `@tokenring-ai/chat` (workspace:*) - Chat service and context handlers
- `@tokenring-ai/filesystem` (workspace:*) - File system operations and `FileMatchResource` base class
- `@tokenring-ai/utility` (workspace:*) - Shared utilities including `KeyedRegistry`, `deepMerge`, and `numberedList`
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

## Copyright

Copyright (c) 2025 Mark Dierolf. All rights reserved.
