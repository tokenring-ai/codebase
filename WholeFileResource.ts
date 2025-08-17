import {FileMatchResource} from "@token-ring/filesystem";

export interface WholeFileItem {
  path: string;
  include: RegExp;
}

export interface WholeFileParams {
  items: WholeFileItem[];
}

/**
 * Class representing a resource that yields whole files.
 */
export default class WholeFileResource extends FileMatchResource {
  name = "WholeFileResource";
  description = "Provides whole files to include in the chat context";

  constructor(params: WholeFileParams) {
    super(params);
  }
}
