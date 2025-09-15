# Codebase Package Documentation

## Overview

The `@tokenring-ai/codebase` package provides a service for managing codebase resources in TokenRing AI agents. Its primary purpose is to selectively include project files and directory structures into the AI's context through memory messages. This enables AI agents to reason about and interact with the codebase by providing file trees and full file contents as needed.

The package integrates with the TokenRing AI framework, leveraging the `FileSystemService` to access files and a registry system to manage active resources. Key features include:
- Generating a directory tree of relevant files.
- Including full contents of specified files in the AI context.
- Chat commands for interactively enabling/disabling resources.

This service is particularly useful for AI-driven code analysis, editing, or generation tasks within a project.

## Installation/Setup

This package is designed for use within the TokenRing AI ecosystem. To install:

1. Ensure you have Node.js (ES2022+ support) installed.
2. Install via npm (assuming it's published; otherwise, link locally):

   ```
   npm install @tokenring-ai/codebase
   ```

3. Dependencies are managed via `package.json`. Key dependency: `@tokenring-ai/filesystem@0.1.0`.

4. Build the package if needed (TypeScript compilation):

   ```
   npx tsc
   ```

   Output goes to `dist-ts/`. Use `type: "module"` in `package.json` for ES modules.

5. Integrate into a TokenRing agent by importing and registering the `CodeBaseService`.

## Package Structure

The package follows a simple structure:

- `index.ts`: Main entry point, exports core classes (`CodeBaseService`, `FileTreeResource`, `WholeFileResource`) and package info with chat commands.
- `CodeBaseService.ts`: Core service implementation for managing resources and generating memories.
- `FileTreeResource.ts`: Resource for providing directory tree functionality (extends `FileMatchResource`).
- `WholeFileResource.ts`: Resource for including full file contents (extends `FileMatchResource`).
- `chatCommands.ts`: Exports chat commands for resource management.
- `commands/codebase.ts`: Implementation of the `/codebaseResources` chat command.
- `package.json`: Package metadata, dependencies, and exports.
- `tsconfig.json`: TypeScript configuration for compilation.
- `README.md`: This documentation file.
- `LICENSE`: MIT license.

## Core Components

### CodeBaseService

The main service class implementing `TokenRingService`. It manages a registry of `FileMatchResource` instances and generates async memories for the AI agent.

- **Description**: Registers, enables, and uses resources to build file trees and yield full file contents. Resources determine which files are included in the AI context.
- **Key Methods**:
  - `registerResource(resource: FileMatchResource)`: Registers a new resource (proxied from registry).
  - `getActiveResourceNames()`: Returns `Set<string>` of currently active resource names.
  - `enableResources(...names: string[])`: Enables specified resources.
  - `getAvailableResources()`: Returns `string[]` of all registered resource names.
  - `async* getMemories(agent: Agent): AsyncGenerator<MemoryItemMessage>`: Yields two types of memories:
    1. A user message with the sorted directory tree of files from active resources (if any).
    2. User messages with full contents of files from `WholeFileResource` instances, prefixed with file paths.

- **Interactions**: Relies on `FileSystemService` for file content retrieval. Resources like `FileTreeResource` and `WholeFileResource` populate sets of files, which are then processed.

Example (in an agent setup):
```typescript
import { CodeBaseService } from '@tokenring-ai/codebase';
import { FileTreeResource, WholeFileResource } from '@tokenring-ai/codebase';

const service = new CodeBaseService();
service.registerResource(new FileTreeResource());
service.registerResource(new WholeFileResource());

service.enableResources('FileTreeResource'); // Enable tree generation

// In agent loop:
for await (const memory of service.getMemories(agent)) {
  // Use memory in context
}
```

### FileTreeResource

- **Description**: Extends `FileMatchResource` to provide file tree (directory structure) for context.
- **Key Properties**:
  - `name: "FileTreeService"`
  - `description: "Provides FileTree functionality"`
- **Usage**: When enabled, contributes to the file tree memory by adding file paths to a set.

### WholeFileResource

- **Description**: Extends `FileMatchResource` to include full file contents in context.
- **Key Properties**:
  - `name: "WholeFileResource"`
  - `description: "Provides whole files to include in the chat context"`
- **Usage**: When enabled and active, adds files to a set, then `getMemories` fetches and yields their full contents via `FileSystemService`.

### Chat Commands

- **Description**: Provides interactive management of codebase resources via `/codebaseResources`.
- **Key Functionality** (in `commands/codebase.ts`):
  - No args: Interactive multi-selection tree for enabling resources.
  - `enable <resource1> <resource2> ...`: Enables specified resources.
  - `set <resource1> <resource2> ...`: Attempts to set active resources (note: limited, as it doesn't clear existing; appends).
  - Validates resources and provides feedback via agent lines (info/error).
  - Builds a tree structure for selection based on resource name segments.

Example command usage (in chat):
```
/codebaseResources enable FileTreeResource WholeFileResource
```

## Usage Examples

1. **Basic Setup and Memory Generation**:
   ```typescript
   import { Agent } from '@tokenring-ai/agent';
   import { CodeBaseService, FileTreeResource } from '@tokenring-ai/codebase';

   const agent = new Agent(/* config */);
   const codebaseService = new CodeBaseService();
   const treeResource = new FileTreeResource();
   codebaseService.registerResource(treeResource);
   codebaseService.enableResources('FileTreeService');

   // Generate memories
   for await (const memory of codebaseService.getMemories(agent)) {
     console.log(memory.content); // Outputs file tree or file contents
   }
   ```

2. **Interactive Resource Management**:
   In the agent's chat interface, use `/codebaseResources` to select resources via a tree UI, then query the agent about the codebase.

3. **Full Integration in Agent**:
   Register the service in the agent's services array. Chat commands are auto-available via `packageInfo.chatCommands`.

## Configuration Options

- **Resource Registration**: Manually register `FileMatchResource` subclasses before enabling.
- **Enabling Resources**: Use chat command or `enableResources()` method. Resources must be registered first.
- **No Environment Variables**: Configuration is runtime via API or chat.
- **Customization**: Extend `FileMatchResource` for custom file matching logic (e.g., globs, filters).

Note: The `set` operation in chat command doesn't clear existing resources; it enables additional ones. A `disableAll` or `clear` method could be added for full control.

## API Reference

- **CodeBaseService**:
  - `constructor()`
  - `registerResource(resource: FileMatchResource): void`
  - `enableResources(...names: string[]): void`
  - `getActiveResourceNames(): Set<string>`
  - `getAvailableResources(): string[]`
  - `async* getMemories(agent: Agent): AsyncGenerator<MemoryItemMessage>`

- **FileTreeResource**:
  - `extends FileMatchResource`
  - Used for tree generation in `getMemories`.

- **WholeFileResource**:
  - `extends FileMatchResource`
  - Triggers full file content inclusion.

- **Chat Command**: `/codebaseResources [enable|set] <resources...>` – See `help()` for details.

## Dependencies

- `@tokenring-ai/agent`: For `Agent`, `TokenRingService`, `MemoryItemMessage`.
- `@tokenring-ai/filesystem`: For `FileSystemService`, `FileMatchResource`.
- `@tokenring-ai/utility`: For `KeyedRegistryWithMultipleSelection`, `joinDefault`.
- Internal: TypeScript, Node.js modules.

Dev dependencies (inferred): `vitest` for testing, TypeScript compiler.

## Contributing/Notes

- **Testing**: Run `npm test` using Vitest.
- **Building**: Use `tsc` for compilation; outputs to `dist-ts`.
- **Known Limitations**:
  - `set` command doesn't reset active resources; consider adding a `disableAll` method.
  - Resources assume access to `FileSystemService`; ensure it's registered in the agent.
  - Binary files or non-UTF-8 may not be handled (focus on text files).
  - No built-in file filtering beyond resource logic; extend `FileMatchResource` as needed.

For contributions, follow TypeScript best practices, add tests, and update this README. License: MIT (see LICENSE file).