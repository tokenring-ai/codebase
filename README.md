# @tokenring-ai/codebase

A TokenRing AI plugin for managing codebase resources and providing intelligent file context to AI agents.

## Overview

The `@tokenring-ai/codebase` package provides a comprehensive service for managing codebase resources in TokenRing AI agents. Its primary purpose is to selectively include project files, directory structures, and repository maps into the AI's context through context handlers. This enables AI agents to reason about and interact with the codebase by providing file trees, full file contents, and symbol information as needed.

### Key Features

- **Resource Management**: Register and manage multiple codebase resources with different strategies
- **File Tree Generation**: Provide directory structure of relevant files to AI context
- **Whole File Inclusion**: Include complete contents of specified files
- **Repository Mapping**: Generate symbol-level repository maps for code understanding using code-chopper
- **Interactive Commands**: Chat-based resource management with tree selection UI
- **Multi-language Support**: Supports JavaScript, TypeScript, Python, C/C++, Rust, Go, Java, Ruby, Bash, and more
- **Tool Integration**: Built-in tools for listing and retrieving resource content
- **Automatic Context Injection**: Context handlers automatically provide resources to agent context
- **Hierarchical Resource Selection**: Interactive tree selection for organizing resources by directory structure

## Installation

```bash
bun install @tokenring-ai/codebase
```

## Quick Start

### Basic Integration

```typescript
import TokenRingApp from "@tokenring-ai/app";
import codebase from "@tokenring-ai/codebase";

const app = new TokenRingApp({
  // your app configuration
});

app.addPlugin(codebase);
app.start();
```

### Configuration

Configure codebase resources in your app configuration:

```typescript
const app = new TokenRingApp({
  config: {
    codebase: {
      resources: {
        "frontend": {
          type: "fileTree",
          // resource-specific configuration
        },
        "backend": {
          type: "repoMap",
          // resource-specific configuration  
        },
        "config-files": {
          type: "wholeFile",
          // resource-specific configuration
        }
      },
      default: {
        resources: ["frontend", "backend"]
      }
    }
  }
});
```

## Package Structure

```
pkg/codebase/
├── index.ts                    # Configuration schema and exports
├── plugin.ts                   # TokenRing plugin implementation
├── CodeBaseService.ts          # Core service implementation
├── FileTreeResource.ts         # File tree resource
├── RepoMapResource.ts          # Repository map resource  
├── WholeFileResource.ts        # Whole file resource
├── tools.ts                    # Tool exports
├── tools/
│   ├── listResources.ts        # List available resources tool
│   └── retrieveContent.ts      # Retrieve resource content tool
├── chatCommands.ts             # Chat command exports
├── commands/
│   └── codebase.ts             # /codebase chat command implementation
├── contextHandlers.ts          # Context handler exports
├── contextHandlers/
│   └── codebaseContext.ts      # Automatic context injection handler
├── package.json
├── README.md
└── vitest.config.ts
```

## Core Components

### CodeBaseService

The main service class implementing `TokenRingService`. It manages a registry of `FileMatchResource` instances using `KeyedRegistryWithMultipleSelection` and generates context items for AI agents.

**Key Methods:**
- `registerResource(name: string, resource: FileMatchResource)`: Register a new resource
- `getActiveResourceNames(): Set<string>`: Get currently active resource names
- `enableResources(resources: string[])`: Enable specified resources
- `getAvailableResources(): string[]`: Get all registered resource names
- `generateRepoMap(files: Set<string>, fileSystem: FileSystemService, agent: Agent)`: Generate repository map from files

**Context Generation Methods:**
- `getLanguageFromExtension(ext: string)`: Map file extensions to language types
- `formatFileOutput(filePath: string, chunks: any[])`: Format repository map entries

### Resource Types

#### FileTreeResource
```typescript
import { FileTreeResource } from "@tokenring-ai/codebase";

// Provides directory structure context
const resource = new FileTreeResource(config);
// Automatically extends FileMatchResource from @tokenring-ai/filesystem
```

#### RepoMapResource  
```typescript
import { RepoMapResource } from "@tokenring-ai/codebase";

// Provides symbol-level repository mapping using code-chopper
const resource = new RepoMapResource(config);
// Parses code and chunks for symbol extraction
```

#### WholeFileResource
```typescript
import { WholeFileResource } from "@tokenring-ai/codebase";

// Provides complete file contents
const resource = new WholeFileResource(config);
// Yields full file contents to agent context
```

### Plugin Integration

The plugin automatically:
- Registers tools with chat service (`codebase/listResources`, `codebase/retrieveContent`)
- Registers context handlers (`codebase-context`)
- Registers chat commands (`/codebase`)
- Creates and registers `CodeBaseService`
- Configures resources based on app configuration

### Chat Commands

Use `/codebase` to manage resources interactively:

```bash
# Interactive resource selection
/codebase select

# Enable specific resources
/codebase enable frontend backend

# List enabled resources
/codebase list

# Show repository map
/codebase repo-map

# Get help
/codebase
```

**Available Actions:**
- `select` - Interactive tree selection of resources
- `enable [resources...]` - Enable specific resources
- `disable [resources...]` - Disable specific resources  
- `list, ls` - List currently enabled resources
- `clear` - Remove all resources from session
- `repo-map, repomap` - Display repository map

### Built-in Tools

#### listResources
List all available and active codebase resources.

**Tool Definition:**
```typescript
{
  "name": "codebase/listResources",
  "description": "Lists all available and currently active codebase resources",
  "inputSchema": z.object({})
}
```

**Response:**
```typescript
{
  ok: boolean;
  availableResources: string[];
  activeResources: string[];
  error?: string;
}
```

#### retrieveContent
Retrieve content from specified codebase resources.

**Tool Definition:**
```typescript
{
  "name": "codebase/retrieveContent",
  "description": "Retrieves content from specified codebase resources (file trees, repo maps, or whole files)",
  "inputSchema": z.object({
    resourceNames: z.array(z.string()).describe("Names of codebase resources to retrieve content from")
  })
}
```

**Response:**
```typescript
{
  ok: boolean;
  content: string;
  error?: string;
}
```

### Context Handler

The `codebase-context` handler automatically provides three types of context to agents:

1. **File Trees**: Directory structure from FileTree resources
2. **Repository Maps**: Symbol information from RepoMap resources using code-chopper
3. **Whole Files**: Complete file contents from WholeFile resources

## Usage Examples

### Basic Setup

```typescript
import { Agent } from "@tokenring-ai/agent";
import { CodeBaseService, FileTreeResource, RepoMapResource } from "@tokenring-ai/codebase";

// Plugin integration (automatic)
const app = new TokenRingApp({
  config: {
    codebase: {
      resources: {
        "src": {
          type: "fileTree"
        },
        "api": {
          type: "repoMap" 
        },
        "config": {
          type: "wholeFile"
        }
      },
      default: {
        resources: ["src", "api"]
      }
    }
  }
});

app.addPlugin(codebase);
// Service, tools, and commands automatically registered
```

### Manual Service Usage

```typescript
import { CodeBaseService } from "@tokenring-ai/codebase";
import { FileSystemService } from "@tokenring-ai/filesystem";
import { Agent } from "@tokenring-ai/agent";

// Create and configure service
const codebaseService = new CodeBaseService();
const fileTreeResource = new FileTreeResource({ /* config */ });
const repoMapResource = new RepoMapResource({ /* config */ });

codebaseService.registerResource("fileTree", fileTreeResource);
codebaseService.registerResource("repoMap", repoMapResource);
codebaseService.enableResources(["fileTree", "repoMap"]);

// Generate repository map
const agent = new Agent(/* config */);
const fileSystem = new FileSystemService();
const files = new Set(["src/main.ts", "src/utils.ts"]);
const repoMap = await codebaseService.generateRepoMap(files, fileSystem, agent);
```

### Custom Resource Configuration

```typescript
// Resources extend FileMatchResource from @tokenring-ai/filesystem
const frontendResource = new FileTreeResource({
  // File matching configuration
});

const apiResource = new RepoMapResource({
  // Code parsing configuration
});

const configResource = new WholeFileResource({
  // File inclusion configuration
});
```

### Multi-language Repository Mapping

The service automatically detects file types and generates appropriate repository maps:

```typescript
// Supported language mappings
getLanguageFromExtension(".js")  // "javascript"
getLanguageFromExtension(".ts")  // "typescript" 
getLanguageFromExtension(".py")  // "python"
getLanguageFromExtension(".cpp") // "cpp"
getLanguageFromExtension(".rs")  // "rust"
getLanguageFromExtension(".go")  // "go"
getLanguageFromExtension(".java") // "java"
getLanguageFromExtension(".rb")  // "ruby"
getLanguageFromExtension(".sh")  // "bash"

Repository map generation uses `code-chopper` library:
- Parses code into chunks
- Extracts symbols and functions
- Formats output for AI context
- Supports filtering and chunking options
```

## API Reference

### CodeBaseService

```typescript
class CodeBaseService implements TokenRingService {
  name: string;
  description: string;
  resourceRegistry: KeyedRegistryWithMultipleSelection<FileMatchResource>;
  
  // Resource management
  registerResource = this.resourceRegistry.register;
  getActiveResourceNames = this.resourceRegistry.getActiveItemNames;
  enableResources = this.resourceRegistry.enableItems;
  getAvailableResources = this.resourceRegistry.getAllItemNames;
  
  // Repository mapping
  async generateRepoMap(
    files: Set<string>,
    fileSystem: FileSystemService,
    agent: Agent
  ): Promise<string | null>;
  
  getLanguageFromExtension(ext: string): LanguageEnum | null;
  formatFileOutput(filePath: string, chunks: any[]): string | null;
}
```

### Resource Base Classes

All resources extend `FileMatchResource` from `@tokenring-ai/filesystem`:

```typescript
abstract class FileMatchResource {
  name: string;
  description: string;
  
  // File matching and filtering logic
  abstract addFilesToSet(files: Set<string>, agent: Agent): Promise<void>;
}
```

### Plugin Configuration

```typescript
const CodeBaseConfigSchema = z.object({
  resources: z.record(z.string(), z.any()),
  default: z.object({
    resources: z.array(z.string()),
  }).optional(),
}).optional();
```

### Exports

From `index.ts`:
```typescript
export { CodeBaseConfigSchema } from "./index.ts";
export { default as FileTreeResource } from "./FileTreeResource.ts";
export { default as RepoMapResource } from "./RepoMapResource.ts";
export { default as WholeFileResource } from "./WholeFileResource.ts";
export { default as CodeBaseService } from "./CodeBaseService.ts";
```

## Context Handler Integration

The `codebase-context` handler provides automatic context injection:

```typescript
// Automatically provides context items to agents
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

## Dependencies

- **@tokenring-ai/agent** (0.2.0) - Agent framework and types
- **@tokenring-ai/app** (0.2.0) - Application framework and plugin system
- **@tokenring-ai/chat** (0.2.0) - Chat service integration
- **@tokenring-ai/filesystem** (0.2.0) - File system utilities and FileMatchResource
- **@tokenring-ai/utility** (0.2.0) - Registry utilities (KeyedRegistryWithMultipleSelection)
- **code-chopper** (^0.1.6) - Code parsing and chunking for repository maps
- **zod** (catalog) - Schema validation

## Development

### Building

```bash
# Compile TypeScript
npx tsc

# Run tests  
bun run test
```

### Testing

Uses Vitest for testing. Run tests with:

```bash
bun run test
```

## Configuration Examples

### Simple Configuration

```typescript
const app = new TokenRingApp({
  config: {
    codebase: {
      resources: {
        "src": { type: "fileTree" },
        "docs": { type: "repoMap" }
      },
      default: {
        resources: ["src"]
      }
    }
  }
});
```

### Advanced Configuration

```typescript
const app = new TokenRingApp({
  config: {
    codebase: {
      resources: {
        "frontend": { 
          type: "fileTree",
          // File matching patterns
        },
        "backend": { 
          type: "repoMap",
          // Code parsing options
        },
        "config": { 
          type: "wholeFile",
          // File inclusion settings
        }
      },
      default: {
        resources: ["frontend", "backend"]
      }
    }
  }
});
```

## License

MIT License - see LICENSE file for details.