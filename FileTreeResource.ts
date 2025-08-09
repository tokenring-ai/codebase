import { FileMatchResource } from "@token-ring/filesystem";

export interface FileTreeItem {
  path: string;
  ignore?: string;
}

export interface FileTreeParams {
  items: FileTreeItem[];
}

/**
 * Class representing a file tree context extending DirectoryService.
 */
export default class FileTreeResource extends FileMatchResource {
  name = "FileTreeService";
  description = "Provides FileTree functionality";

  static constructorProperties = {
    items: {
      type: "array",
      description: "Files to insert into the chat memory",
      items: {
        type: "object",
        properties: {
          path: {
            type: "string",
            required: true,
            description:
              "Path to directory or file to insert into the chat memory",
          },
          ignore: {
            type: "string",
            description:
              "A .gitignore/node-glob ignore style list of files to ignore",
          },
        },
      },
    },
  } as const;

  constructor(params: FileTreeParams) {
    // pass-through to base class which handles items
    super(params as any);
  }
}
