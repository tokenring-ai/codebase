import { Service } from "@token-ring/registry";
import FileTreeResource from "./FileTreeResource.js";
import { FileSystemService } from "@token-ring/filesystem";
import WholeFileResource from "./WholeFileResource.js";

export default class CodeBaseService extends Service {
	/**
	 * Asynchronously yields memories from file tree * whole files
	 * @async
	 * @generator
	 * @yields {MemoryItem} - Memories
	 */
	async *getMemories(registry) {
		const fileTreeFiles = new Set();

		const fileTreeResources =
			registry.resources.getResourcesByType(FileTreeResource);
		for (const resource of fileTreeResources) {
			await resource.addFilesToSet(fileTreeFiles, registry);
		}

		if (fileTreeFiles.size > 0) {
			yield {
				role: "user",
				content: `// Directory Tree of project files:\n${Array.from(fileTreeFiles).sort().join("\n")}`,
			};
		}

		const wholeFiles = new Set();

		const wholeFileResources =
			registry.resources.getResourcesByType(WholeFileResource);
		for (const resource of wholeFileResources) {
			await resource.addFilesToSet(wholeFiles, registry);

			for await (const file of resource.getMatchedFiles(registry)) {
				wholeFiles.add(file);
			}
		}

		const fileSystem = registry.requireFirstServiceByType(FileSystemService);
		for await (const file of wholeFiles) {
			const content = await fileSystem.getFile(file);
			yield {
				role: "user",
				content: `// Complete contents of file: ${file}\n${content}`,
			};
		}
	}
}
