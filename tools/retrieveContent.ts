import Agent from "@tokenring-ai/agent/Agent";
import { FileSystemService } from "@tokenring-ai/filesystem";
import { z } from "zod";
import CodeBaseService from "../CodeBaseService.js";
import RepoMapResource from "../RepoMapResource.js";
import WholeFileResource from "../WholeFileResource.js";

export const name = "codebase/retrieveContent";

export async function execute(
	{ resourceNames }: { resourceNames?: string[] },
	agent: Agent,
): Promise<{
	ok: boolean;
	content: string;
	error?: string;
}> {
	const codebaseService = agent.requireServiceByType(CodeBaseService);
	const fileSystem = agent.requireServiceByType(FileSystemService);

	const availableResources = codebaseService.getAvailableResources();
	const resourceRegistry = (codebaseService as any).resourceRegistry;
	if (!resourceNames) {
		throw new Error("No resource names provided");
	}

	for (const name of resourceNames) {
		if (!availableResources.includes(name)) {
			return {
				ok: false,
				content: "",
				error: `Resource '${name}' not found. Available: ${availableResources.join(", ")}`,
			};
		}
	}

	const results: string[] = [];

	for (const name of resourceNames) {
		const resource = resourceRegistry.getItem(name);
		if (!resource) continue;

		const files = new Set<string>();
		await resource.addFilesToSet(files, agent);

		if (resource instanceof RepoMapResource) {
			const repoMap = await codebaseService.generateRepoMap(
				files,
				fileSystem,
				agent,
			);
			if (repoMap) {
				results.push(`=== ${name} (Repo Map) ===\n${repoMap}`);
			}
		} else if (resource instanceof WholeFileResource) {
			for (const file of files) {
				const content = await fileSystem.getFile(file);
				results.push(`=== ${name} - ${file} ===\n${content}`);
			}
		} else {
			// File tree
			if (files.size > 0) {
				results.push(
					`=== ${name} (File Tree) ===\n${Array.from(files).sort().join("\n")}`,
				);
			}
		}
	}

	return {
		ok: true,
		content: results.join("\n\n"),
	};
}

export const description =
	"Retrieves content from specified codebase resources (file trees, repo maps, or whole files).";

export const inputSchema = z.object({
	resourceNames: z
		.array(z.string())
		.describe("Names of codebase resources to retrieve content from"),
});
