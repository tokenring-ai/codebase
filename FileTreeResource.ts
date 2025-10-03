import { FileMatchResource } from "@tokenring-ai/filesystem";

/**
 * Class representing a file tree context extending DirectoryService.
 */
export default class FileTreeResource extends FileMatchResource {
	name = "FileTreeService";
	description = "Provides FileTree functionality";
}
