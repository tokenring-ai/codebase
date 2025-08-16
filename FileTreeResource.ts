import {FileMatchResource} from "@token-ring/filesystem";

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
  static constructorProperties = {
    items: {
      type: "array",
      description: "Files to match",
      items: {
        type: "object",
        properties: {
          path: {
            type: "string",
            required: true,
            description: "Path to directory to include",
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
  name = "FileTreeService";
  description = "Provides FileTree functionality";

  constructor(params: FileTreeParams) {
    // pass-through to base class which handles items
    super(params as any);
  }
}
