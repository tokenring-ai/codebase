# @tokenring-ai/codebase

## Overview

The `@tokenring-ai/codebase` package provides a service for managing codebase resources in TokenRing AI agents. Its primary purpose is to selectively include project files, directory structures, and repository maps into the agent's context through context handlers. This enables AI agents to reason about and interact with the codebase by providing file trees, full file contents, and symbol information as needed.

### Key Features

- **Multiple Resource Types**: File trees, repository maps, and whole file contents
- **Interactive Management**: `/codebase` commands for resource selection and management (via ChatCommandService)
- **State Management**: Persistent resource enablement across agent sessions
- **Wildcard Support**: Pattern matching for resource selection
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
- `resourceRegistry`: Registry managing all FileMatchResource instances (readonly)
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
- `setEnabledResources(resourceNames, agent)`: Sets enabled resources (returns Set<string>)
- `enableResources(resourceNames, agent)`: Enables specific resources (returns Set<string>)
- `disableResources(resourceNames, agent)`: Disables specific resources (returns Set<string>)
- `generateRepoMap(files, fileSystem, agent)`: Generates repository map from files
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

The package includes three resource types that act as providers for different kinds of codebase information:

### FileTreeResource

Extends `FileMatchResource` from `@tokenring-ai/filesystem`. Provides directory structure context.

```typescript
import FileTreeResource from "@tokenring-ai/codebase/FileTreeResource";

const fileTreeResource = new FileTreeResource(config);
```

**Resource Properties:**

- `name`: Resource identifier ("FileTreeService")
- `description`: Resource description

### RepoMapResource

Extends `FileMatchResource`. Provides symbol-level repository mapping using code-chopper.

```typescript
import RepoMapResource from "@tokenring-ai/codebase/RepoMapResource";

const repoMapResource = new RepoMapResource(config);
```

**Resource Properties:**

- `name`: Resource identifier ("RepoMapResource")
- `description`: Resource description

### WholeFileResource

Extends `FileMatchResource`. Provides complete file contents to agent context.

```typescript
import WholeFileResource from "@tokenring-ai/codebase/WholeFileResource";

const wholeFileResource = new WholeFileResource(config);
```

**Resource Properties:**

- `name`: Resource identifier ("WholeFileResource")
- `description`: Resource description

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
  chatConfig: ParsedChatConfig,
  params: {},
  agent: Agent
): AsyncGenerator<ContextItem>
```

**Context Generation:**

The context handler generates three types of context items:

1. **File Tree**: Directory structure of enabled file tree resources
   - Only includes resources that are instances of `FileTreeResource`
   - Uses `addFilesToSet()` to collect file paths

2. **Repo Map**: Symbol-level documentation from enabled repo map resources
   - Only includes resources that are instances of `RepoMapResource`
   - Uses `code-chopper` to parse files and extract symbols
   - Generates human-readable symbol documentation

3. **Whole Files**: Complete file contents from enabled whole file resources
   - Only includes resources that are instances of `WholeFileResource`
   - Reads full file contents and includes them in context

The context is yielded in stages, first file trees, then repo maps, then whole files, allowing the agent to process them in a logical order.

## State Management

State is managed through state properties stored in the agent:

The service uses `agent.initializeState()` and `agent.getState()` to manage enabled resources as a `Set<string>`:

- **enabledResources**: Set of currently enabled resource names

State is automatically initialized when an agent attaches to the service with resource configuration merged from defaults and agent-specific config.

**State Initialization:**

```typescript
constructor(
  initialConfig: z.output<typeof CodeBaseServiceConfigSchema>["agentDefaults"]
)
```

The enabled resource names can include wildcards which are mapped to actual tool names via `ensureItemNamesLike()` during agent attachment.

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

### Managing Resources

The service manages enabled resources through agent state:

```typescript
// Get enabled resource names
const names = codebaseService.getEnabledResourceNames(agent);

// Get enabled resource instances
const resources = codebaseService.getEnabledResources(agent);

// Set enabled resources (mutates state)
const updated = codebaseService.setEnabledResources(["src", "api"], agent);

// Enable resources (mutates state)
const added = codebaseService.enableResources(["doc"], agent);

// Disable resources (mutates state)
const removed = codebaseService.disableResources(["src"], agent);
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
app.install(plug, {
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
│   └── codebase.ts          # Agent command implementation
├── contextHandlers/
│   └── codebaseContext.ts   # Context handler for chat integration
├── state/
│   └── codeBaseState.ts     # Agent state management (referenced in service)
├── CodeBaseService.ts       # Main service implementation
├── FileTreeResource.ts      # File tree resource provider
├── RepoMapResource.ts       # Repository map resource provider
├── WholeFileResource.ts     # Whole file resource provider
├── chatCommands.ts          # Chat command exports (barrel)
├── contextHandlers.ts       # Context handler exports (barrel)
├── plugin.ts                # Plugin registration and installation
├── index.ts                 # Public API exports
├── schema.ts                # Configuration schemas
├── package.json             # Package metadata
└── README.md                # This file
```

## Dependencies

This package depends on:

- `@tokenring-ai/agent` - Central orchestration system
- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/chat` - Chat service and context handlers
- `@tokenring-ai/filesystem` - File system operations (`FileMatchResource`)
- `@tokenring-ai/utility` - Shared utilities (`KeyedRegistry`, `deepMerge`)
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
