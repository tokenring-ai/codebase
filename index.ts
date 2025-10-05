import type { AgentTeam, TokenRingPackage } from "@tokenring-ai/agent";
import { z } from "zod";
import * as chatCommands from "./chatCommands.ts";
import CodeBaseService from "./CodeBaseService.ts";
import FileTreeResource from "./FileTreeResource.ts";
import packageJSON from "./package.json" with { type: "json" };
import RepoMapResource from "./RepoMapResource.ts";
import * as tools from "./tools.ts";
import WholeFileResource from "./WholeFileResource.ts";

export const CodeBaseConfigSchema = z
	.object({
		resources: z.record(z.string(), z.any()),
		default: z
			.object({
				resources: z.array(z.string()),
			})
			.optional(),
	})
	.optional();

export const packageInfo: TokenRingPackage = {
	name: packageJSON.name,
	version: packageJSON.version,
	description: packageJSON.description,
	install(agentTeam: AgentTeam) {
		const config = agentTeam.getConfigSlice("codebase", CodeBaseConfigSchema);
		if (config) {
			agentTeam.addTools(packageInfo, tools);
			agentTeam.addChatCommands(chatCommands);
			const codebaseService = new CodeBaseService();
			agentTeam.addServices(codebaseService);

			for (const name in config.resources) {
				const resourceConfig = config.resources[name];
				switch (resourceConfig.type) {
					case "fileTree":
						codebaseService.registerResource(
							name,
							new FileTreeResource(resourceConfig),
						);
						break;
					case "repoMap":
						codebaseService.registerResource(
							name,
							new RepoMapResource(resourceConfig),
						);
						break;
					case "wholeFile":
						codebaseService.registerResource(
							name,
							new WholeFileResource(resourceConfig),
						);
						break;
				}
			}
			if (config.default?.resources) {
				codebaseService.enableResources(config.default.resources);
			}
		}
	},
};

export { default as FileTreeResource } from "./FileTreeResource.ts";
export { default as RepoMapResource } from "./RepoMapResource.ts";
export { default as WholeFileResource } from "./WholeFileResource.ts";
export { default as CodeBaseService } from "./CodeBaseService.ts";
