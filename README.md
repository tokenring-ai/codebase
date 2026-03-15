# @tokenring-ai/codebase

## Overview

The `@tokenring-ai/codebase` package provides a service for managing codebase resources in TokenRing AI agents. Its primary purpose is to selectively include project files, directory structures, and repository maps into the agent's context through context handlers. This enables AI agents to reason about and interact with the codebase by providing file trees, full file contents, and symbol information as needed.

### Key Features

- **Multiple Resource Types**: File trees, repository maps, and whole file contents
- **Interactive Management**: `/codebase` commands for resource selection and management
- **State Management**: Persistent resource enablement across agent sessions
- **Wildcard Support**: Pattern matching for resource selection (e.g., `src/*`)
- **Multi-language Support**: Automatic detection and mapping of file types
- **Context Injection**: Automatic codebase context in chat sessions
- **Symbol-Level Mapping**: Uses code-chopper to extract and document symbols from source files

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
  }).default({});

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
registerResource(
  name: string,
  resource: FileMatchResource
): void

getAvailableResources(): string[]

getEnabledResourceNames(
  agent: Agent
): Set<string>

getEnabledResources(
  agent: Agent
): FileMatchResource[]

setEnabledResources(
  resourceNames: string[],
  agent: Agent
): Set<string>

enableResources(
  resourceNames: string[],
  agent: Agent
): Set<string>

disableResources(
  resourceNames: string[],
  agent: Agent
): Set<string>
```

**Repository Mapping Methods:**

```typescript
async generateRepoMap(
  files: Set<string>,
  fileSystem: FileSystemService,
  agent: Agent
): Promise<string | null>

getLanguageFromExtension(
  ext: string
): LanguageEnum | null

formatFileOutput(
  filePath: string,
  chunks: any[]
): string | null
```

**Method Descriptions:**

- `registerResource(name, resource)`: Registers a new resource with the service
- `getAvailableResources()`: Returns all registered resource names as an array
- `getEnabledResourceNames(agent)`: Returns a Set of enabled resource names
- `getEnabledResources(agent)`: Returns an array of enabled FileMatchResource instances
- `setEnabledResources(resourceNames, agent)`: Sets enabled resources (replaces current selection, returns Set<string>)
- `enableResources(resourceNames, agent)`: Enables specific resources (adds to current selection, returns Set<string>)
- `disableResources(resourceNames, agent)`: Disables specific resources (removes from current selection, returns Set<string>)
- `generateRepoMap(files, fileSystem, agent)`: Generates repository map from files using code-chopper
- `getLanguageFromExtension(ext)`: Maps file extensions to language types
- `formatFileOutput(filePath, chunks)`: Formats repository map entries from chunks

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

The package includes three resource types that extend FileMatchResource from @tokenring-ai/filesystem:

### FileTreeResource

Extends `FileMatchResource`. Provides directory structure context.

```typescript
import FileTreeResource from "@tokenring-ai/codebase/FileTreeResource";

const fileTreeResource = new FileTreeResource(config);
```

**Resource Properties:**

- `name`: Resource identifier ("FileTreeService")
- `description`: Resource description ("Provides FileTree functionality")
- Extends `FileMatchResource` from `@tokenring-ai/filesystem`

### RepoMapResource

Extends `FileMatchResource`. Provides symbol-level repository mapping using code-chopper.

```typescript
import RepoMapResource from "@tokenring-ai/codebase/RepoMapResource";

const repoMapResource = new RepoMapResource(config);
```

**Resource Properties:**

- `name`: Resource identifier ("RepoMapResource")
- `description`: Resource description ("Provides RepoMap functionality")
- Extends `FileMatchResource` from `@tokenring-ai/filesystem`

### WholeFileResource

Extends `FileMatchResource`. Provides complete file contents to agent context.

```typescript
import WholeFileResource from "@tokenring-ai/codebase/WholeFileResource";

const wholeFileResource = new WholeFileResource(config);
```

**Resource Properties:**

- `name`: Resource identifier ("WholeFileResource")
- `description`: Resource description ("Provides whole files to include in the chat context")
- Extends `FileMatchResource` from `@tokenring-ai/filesystem`

## RPC Endpoints

The package does not define any RPC endpoints.

## State Management

State is managed through the `CodeBaseState` class stored in the agent:

```typescript
export class CodeBaseState implements AgentStateSlice<typeof serializationSchema> {
  readonly name = "CodeBaseState";
  serializationSchema = serializationSchema;
  enabledResources: Set<string>;
  
  constructor(readonly initialConfig: z.output<typeof CodeBaseServiceConfigSchema>["agentDefaults"]);
  
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

- **enabledResources**: Set of currently enabled resource names
- **State Transfer**: Resources are transferred from parent agents when cloning via `transferStateFromParent()`
- **Serialization**: Resources are serialized as an array for persistence
- **Reset**: Resources can be reset to initial configuration via `reset()`
- **UI Representation**: `show()` method returns human-readable list of enabled resources

The enabled resource names can include wildcards which are mapped to actual resource names via `ensureItemNamesLike()` during agent attachment.

**State Methods:**

- `transferStateFromParent(parent)`: Transfers enabled resources from a parent agent when cloning
- `reset()`: Resets enabled resources to the initial configuration
- `serialize()`: Serializes the state for persistence
- `deserialize(data)`: Deserializes state from persisted data
- `show()`: Returns a human-readable list of enabled resources

## Context Handlers

The package provides context handlers for integrating with the chat system:

```typescript
import { codebaseContext } from "@tokenring-ai/codebase/contextHandlers";
```

### codebase-context

The main context handler provides automatic context injection to agents:

```typescript
import codebaseContext from "@tokenring-ai/codebase/contextHandlers/codebaseContext";

export default async function* getContextItems({
  agent
}: ContextHandlerOptions): AsyncGenerator<ContextItem>
```

**Context Generation:**

The context handler generates three types of context items in order:

1. **File Tree**: Directory structure of enabled file tree resources
   - Only includes resources that are NOT instances of `WholeFileResource` or `RepoMapResource`
   - Uses `addFilesToSet()` to collect file paths
   - Yields a single context item with sorted file paths

2. **Repo Map**: Symbol-level documentation from enabled repo map resources
   - Only includes resources that are instances of `RepoMapResource`
   - Uses `code-chopper` to parse files and extract symbols
   - Generates human-readable symbol documentation
   - Yields a single context item with the repository map

3. **Whole Files**: Complete file contents from enabled whole file resources
   - Only includes resources that are instances of `WholeFileResource`
   - Reads full file contents and includes them in context
   - Yields one context item per file

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
  content: `// These are snippets of the symbols in the project...\nsrc/index.ts:\n- export function main()`
}

// Whole file context item
{
  role: "user",
  content: `// Complete contents of file: src/index.ts\nimport ...`
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

The `/codebase select` command uses a tree view for interactive selection:

```typescript
// The buildResourceTree function organizes resources by category
import { buildResourceTree } from "@tokenring-ai/codebase/commands/codebase/buildResourceTree";

const resources = ["src/utils", "src/types", "api/handlers", "docs/readme"];
const tree = buildResourceTree(resources);

// Result:
[
  {
    name: "src",
    value: "src/*",
    children: [
      { name: "utils", value: "src/utils" },
      { name: "types", value: "src/types" }
    ]
  },
  {
    name: "api",
    value: "api/*",
    children: [
      { name: "handlers", value: "api/handlers" }
    ]
  },
  {
    name: "docs",
    value: "docs/*",
    children: [
      { name: "readme", value: "docs/readme" }
    ]
  }
]
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
└── README.md                     # This file
```

## Dependencies

This package depends on:

- `@tokenring-ai/agent` - Central orchestration system
- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/chat` - Chat service and context handlers
- `@tokenring-ai/filesystem` - File system operations (`FileMatchResource`)
- `@tokenring-ai/utility` - Shared utilities (`KeyedRegistry`, `deepMerge`, etc.)
- `code-chopper` - Code parsing and symbol extraction
- `zod` - Schema validation

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
