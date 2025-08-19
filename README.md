# @token-ring/codebase

Codebase resources and utilities for Token Ring agents. This package helps an agent build contextual "memories" from the
repository by:

- Emitting a directory tree of selected files and folders.
- Emitting the complete contents of selected files.

It does this via three main exports:

- FileTreeResource: declares directories/files to be summarized as a tree.
- WholeFileResource: declares files to be read in full.
- CodeBaseService: streams chat-ready memory messages based on the above resources and the FileSystemService.

## Installation

This package is part of the Token Ring monorepo. In a workspace it is referenced as:

- Name: `@token-ring/codebase`
- Version: `0.1.0`

Ensure the following peer packages are available in your workspace:

- `@token-ring/registry`
- `@token-ring/filesystem`

## Exports

```ts
import {
  FileTreeResource,
  WholeFileResource,
  CodeBaseService,
} from "@token-ring/codebase";
```

## Concepts

- Resources: FileTreeResource and WholeFileResource extend `FileMatchResource` from `@token-ring/filesystem`. They
  accept an `items` array where each item has:
- `path`: string. Directory or file path to include.
- `ignore` (optional): string. A .gitignore/node-glob style ignore list.

- CodeBaseService: A Service that yields chat "memories" by asking the registry for resources and reading files from
  `FileSystemService`.
- First yields a single message with the project directory tree (if `FileTreeResource` matched any files).
- Then yields one message per fully included file (from `WholeFileResource`).

Each yielded item has the shape `{ role: string; content: string }` where `role` is typically `"user"` and `content` is
a formatted string.

## Usage

Below is a minimal example showing how to register resources and stream memories.

```ts
import { ServiceRegistry } from "@token-ring/registry";
import { FileSystemService } from "@token-ring/filesystem";
import {
  FileTreeResource,
  WholeFileResource,
  CodeBaseService,
} from "@token-ring/codebase";

// 1) Create the registry and required services
const registry = new ServiceRegistry();
registry.registerService(new FileSystemService());

// 2) Register resources describing which files to include
registry.resources.register(
  new FileTreeResource({
    items: [
      { path: "src" },               // include a directory tree
      { path: "package.json" },      // and a single file
      // ignore patterns are supported, e.g. ignore: "**/*.test.*\nnode_modules/**"
    ],
  })
);

registry.resources.register(
  new WholeFileResource({
    items: [
      { path: "README.md" },         // include entire files
      { path: "src/index.ts" },
    ],
  })
);

// 3) Use CodeBaseService to stream chat-ready memories
const codebase = new CodeBaseService();
for await (const memory of codebase.getMemories(registry)) {
  // memory.role === "user"
  // memory.content contains either the directory tree or the full file content
  console.log(memory);
}
```

### What gets emitted?

- Directory tree message (only if at least one file matched by FileTreeResource):
- A single message starting with:
  `// Directory Tree of project files:`
- Followed by the matched paths, sorted, one per line.

- Whole file messages:
- One message per file, each starting with:
  `// Complete contents of file: <path>`
- Followed by the file's content as retrieved from `FileSystemService`.

## API Summary

- FileTreeResource
- Constructor: `new FileTreeResource({ items: { path: string; ignore?: string }[] })`
- Purpose: Gather a set of files/dirs and emit a directory tree summary.

- WholeFileResource
- Constructor: `new WholeFileResource({ items: { path: string; ignore?: string }[] })`
- Purpose: Gather a set of files and emit their full contents.

- CodeBaseService
- Method: `async *getMemories(registry: Registry): AsyncGenerator<{ role: string; content: string }>`
- Purpose: Stream chat-ready messages based on the above resources and the file system.

## Notes

- File matching and ignore behavior are provided by `@token-ring/filesystem`'s `FileMatchResource`.
- Ensure you register a `FileSystemService` in the `ServiceRegistry`; it is required to read files.
- This package uses ES modules and TypeScript source files are exported directly in the workspace setup.

## License

MIT