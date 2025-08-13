import {FileMatchResource} from "@token-ring/filesystem";

export interface WholeFileItem {
  path: string;
  ignore?: string;
}

export interface WholeFileParams {
  items: WholeFileItem[];
}

/**
 * Class representing a resource that yields whole files.
 */
export default class WholeFileResource extends FileMatchResource {
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

  constructor(params: WholeFileParams) {
    super(params as any);
  }
}
