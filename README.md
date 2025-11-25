# @tokenring-ai/codebase

A TokenRing AI plugin for managing codebase resources and providing intelligent file context to AI agents.

## Overview

The `@tokenring-ai/codebase` package provides a comprehensive service for managing codebase resources in TokenRing AI agents. Its primary purpose is to selectively include project files, directory structures, and repository maps into the AI's context through memory messages. This enables AI agents to reason about and interact with the codebase by providing file trees, full file contents, and symbol information as needed.

### Key Features

- **Resource Management**: Register and manage multiple codebase resources with different strategies
- **File Tree Generation**: Provide directory structure of relevant files to AI context
- **Whole File Inclusion**: Include complete contents of specified files
- **Repository Mapping**: Generate symbol-level repository maps for code understanding
- **Interactive Commands**: Chat-based resource management with tree selection UI
- **Multi-language Support**: Supports JavaScript, TypeScript, Python, C/C++, Rust, Go, Java, Ruby, Bash, and more
- **Tool Integration**: Built-in tools for listing and retrieving resource content

## Installation

```bash
npm install @tokenring-ai/codebase
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
├── index.ts                 # Main entry point and plugin definition
├── CodeBaseService.ts       # Core service implementation
├── FileTreeResource.ts      # File tree resource (extends FileMatchResource)
├── RepoMapResource.ts       # Repository map resource (extends FileMatchResource)
├── WholeFileResource.ts     # Whole file resource (extends FileMatchResource)
├── tools.ts                 # Tool exports
├── tools/
│   ├── listResources.ts     # List available resources tool
│   └── retrieveContent.ts   # Retrieve resource content tool
├── chatCommands.ts          # Chat command exports
├── commands/
│   └── codebase.ts          # /codebase chat command implementation
├── package.json
├── tsconfig.json
└── README.md
```

## Core Components

### CodeBaseService

The main service class implementing `TokenRingService`. It manages a registry of `FileMatchResource` instances and generates context items for the AI agent.

**Key Methods:**
- `registerResource(resource: FileMatchResource)`: Register a new resource
- `getActiveResourceNames()`: Get currently active resource names
- `enableResources(...names: string[])`: Enable specified resources
- `getAvailableResources()`: Get all registered resource names
- `async* getContextItems(agent: Agent)`: Generate context items for AI

**Context Generation Flow:**
1. **File Tree**: Directory structure from all non-whole-file resources
2. **Repository Map**: Symbol information from RepoMap resources
3. **Whole Files**: Complete file contents from WholeFile resources

### Resource Types

#### FileTreeResource
```typescript
import { FileTreeResource } from "@tokenring-ai/codebase";

// Provides directory structure context
const resource = new FileTreeResource({
  // configuration options
});
```

#### RepoMapResource
```typescript
import { RepoMapResource } from "@tokenring-ai/codebase";

// Provides symbol-level repository mapping
const resource = new RepoMapResource({
  // configuration options
});
```

#### WholeFileResource
```typescript
import { WholeFileResource } from "@tokenring-ai/codebase";

// Provides complete file contents
const resource = new WholeFileResource({
  // configuration options
});
```

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
- `list` - List currently enabled resources
- `repo-map` - Display repository map
- `clear` - Remove all resources from session

### Built-in Tools

#### listResources
List all available and active codebase resources.

```typescript
// Tool call
{
  "name": "codebase/listResources",
  "description": "Lists all available and currently active codebase resources",
  "parameters": {}
}
```

#### retrieveContent
Retrieve content from specified codebase resources.

```typescript
// Tool call
{
  "name": "codebase/retrieveContent", 
  "description": "Retrieves content from specified codebase resources",
  "parameters": {
    "resourceNames": ["frontend", "backend"]
  }
}
```

## Usage Examples

### Basic Setup

```typescript
import { Agent } from "@tokenring-ai/agent";
import { CodeBaseService, FileTreeResource, RepoMapResource } from "@tokenring-ai/codebase";

// Create and configure service
const codebaseService = new CodeBaseService();
codebaseService.registerResource(new FileTreeResource());
codebaseService.registerResource(new RepoMapResource());
codebaseService.enableResources("FileTreeResource", "RepoMapResource");

// Use in agent
const agent = new Agent(/* config */);
agent.addService(codebaseService);

// Access context items
for await (const item of codebaseService.getContextItems(agent)) {
  console.log(item.content);
}
```

### Custom Resource Configuration

```typescript
// Configure with custom options
const frontendResource = new FileTreeResource({
  include: ["src/**/*", "public/**/*"],
  exclude: ["**/*.test.*", "**/node_modules/**"]
});

const apiResource = new RepoMapResource({
  include: ["api/**/*.ts", "services/**/*.ts"],
  language: "typescript"
});

codebaseService.registerResource("frontend", frontendResource);
codebaseService.registerResource("api", apiResource);
```

### Multi-language Repository Mapping

The service automatically detects file types and generates appropriate repository maps:

```typescript
// Supports multiple programming languages
const supportedLanguages = [
  ".js", ".jsx",      // JavaScript
  ".ts", ".tsx",      // TypeScript  
  ".py",              // Python
  ".c", ".h",         // C/C++
  ".cpp", ".hpp",     // C++
  ".rs",              // Rust
  ".go",              // Go
  ".java",            // Java
  ".rb",              // Ruby
  ".sh", ".bash"      // Shell scripts
];
```

## API Reference

### CodeBaseService

```typescript
class CodeBaseService implements TokenRingService {
  name: string;
  description: string;
  
  registerResource(name: string, resource: FileMatchResource): void;
  getActiveResourceNames(): Set<string>;
  enableResources(...names: string[]): void;
  getAvailableResources(): string[];
  async* getContextItems(agent: Agent): AsyncGenerator<ContextItem>;
}
```

### Resource Base Classes

All resources extend `FileMatchResource` from `@tokenring-ai/filesystem`:

```typescript
abstract class FileMatchResource {
  // File matching and filtering logic
  abstract addFilesToSet(files: Set<string>, agent: Agent): Promise<void>;
}
```

### Configuration Schema

```typescript
const CodeBaseConfigSchema = z.object({
  resources: z.record(z.string(), z.any()),
  default: z.object({
    resources: z.array(z.string()),
  }).optional(),
});
```

## Dependencies

- **@tokenring-ai/agent** - Agent framework and types
- **@tokenring-ai/chat** - Chat service integration
- **@tokenring-ai/app** - Application framework
- **@tokenring-ai/filesystem** - File system utilities and FileMatchResource
- **@tokenring-ai/utility** - Registry utilities and string helpers
- **code-chopper** - Code parsing and chunking for repository maps
- **zod** - Schema validation

## Development

### Building

```bash
# Compile TypeScript
npx tsc

# Run tests
npm test
```

### Testing

Uses Vitest for testing. Run tests with:

```bash
npm test
```

## License

MIT License - see LICENSE file for details.