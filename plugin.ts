import {AgentCommandService} from "@tokenring-ai/agent";
import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {z} from "zod";
import chatCommands from "./chatCommands.ts";
import CodeBaseService from "./CodeBaseService.ts";
import contextHandlers from "./contextHandlers.ts";
import FileTreeResource from "./FileTreeResource.ts";
import {CodeBaseConfigSchema} from "./index.ts";
import packageJSON from "./package.json" with {type: "json"};
import RepoMapResource from "./RepoMapResource.ts";
import tools from "./tools.ts";
import WholeFileResource from "./WholeFileResource.ts";

const packageConfigSchema = z.object({
  codebase: CodeBaseConfigSchema.optional(),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    // const config = app.getConfigSlice("codebase", CodeBaseConfigSchema);
    if (config.codebase) {
      app.waitForService(ChatService, chatService => {
        chatService.addTools(packageJSON.name, tools);
        chatService.registerContextHandlers(contextHandlers);
      });
      app.waitForService(AgentCommandService, agentCommandService =>
        agentCommandService.addAgentCommands(chatCommands)
      );
      const codebaseService = new CodeBaseService();
      app.addServices(codebaseService);

      for (const name in config.codebase.resources) {
        const resourceConfig = config.codebase.resources[name];
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
      codebaseService.enableResources(config.codebase.defaultResources);
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
