import {AgentCommandService} from "@tokenring-ai/agent";
import {ChatService} from "@tokenring-ai/chat";
import TokenRingApp, {TokenRingPlugin} from "@tokenring-ai/app";
import {z} from "zod";
import chatCommands from "./chatCommands.ts";
import contextHandlers from "./contextHandlers.ts";
import CodeBaseService from "./CodeBaseService.ts";
import FileTreeResource from "./FileTreeResource.ts";
import packageJSON from "./package.json" with {type: "json"};
import RepoMapResource from "./RepoMapResource.ts";
import tools from "./tools.ts";
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

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app: TokenRingApp) {
    const config = app.getConfigSlice("codebase", CodeBaseConfigSchema);
    if (config) {
      app.waitForService(ChatService, chatService => {
        chatService.addTools(packageJSON.name, tools);
        chatService.registerContextHandlers(contextHandlers);
      });
      app.waitForService(AgentCommandService, agentCommandService =>
        agentCommandService.addAgentCommands(chatCommands)
      );
      const codebaseService = new CodeBaseService();
      app.addServices(codebaseService);

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
} as TokenRingPlugin;

export {default as FileTreeResource} from "./FileTreeResource.ts";
export {default as RepoMapResource} from "./RepoMapResource.ts";
export {default as WholeFileResource} from "./WholeFileResource.ts";
export {default as CodeBaseService} from "./CodeBaseService.ts";
