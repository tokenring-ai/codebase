import {AgentCommandService} from "@tokenring-ai/agent";
import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {z} from "zod";
import chatCommands from "./chatCommands.ts";
import CodeBaseService from "./CodeBaseService.ts";
import contextHandlers from "./contextHandlers.ts";
import FileTreeResource from "./FileTreeResource.ts";
import packageJSON from "./package.json" with {type: "json"};
import RepoMapResource from "./RepoMapResource.ts";
import {CodeBaseConfigSchema} from "./schema.ts";
import WholeFileResource from "./WholeFileResource.ts";

const packageConfigSchema = z.object({
  codebase: CodeBaseConfigSchema.optional(),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (! config.codebase) return;
    app.waitForService(ChatService, chatService => {
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
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
