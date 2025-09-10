import {FileMatchResource} from "@tokenring-ai/filesystem";

/**
 * Class representing a resource that yields whole files.
 */
export default class WholeFileResource extends FileMatchResource {
  name = "WholeFileResource";
  description = "Provides whole files to include in the chat context";
}
