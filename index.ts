import type { TokenRingPackage } from "@tokenring-ai/agent";
import * as chatCommands from "./chatCommands.ts";
import * as tools from "./tools.ts";
import packageJSON from "./package.json" with { type: "json" };

export { default as FileTreeResource } from "./FileTreeResource.ts";
export { default as RepoMapResource } from "./RepoMapResource.ts";
export { default as WholeFileResource } from "./WholeFileResource.ts";
export { default as CodeBaseService } from "./CodeBaseService.ts";

export const packageInfo: TokenRingPackage = {
	name: packageJSON.name,
	version: packageJSON.version,
	description: packageJSON.description,
	chatCommands,
	tools,
};
