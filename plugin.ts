import { AgentCommandService } from "@tokenring-ai/agent";
import type { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { z } from "zod";
import CodeBaseService from "./CodeBaseService.ts";
import agentCommands from "./commands.ts";
import contextHandlers from "./contextHandlers.ts";
import FileTreeResource from "./FileTreeResource.ts";
import packageJSON from "./package.json" with { type: "json" };
import RepoMapResource from "./RepoMapResource.ts";
import { CodeBaseServiceConfigSchema } from "./schema.ts";
import WholeFileResource from "./WholeFileResource.ts";

const packageConfigSchema = z.object({
  codebase: CodeBaseServiceConfigSchema,
});

export default {
  name: packageJSON.name,
  displayName: "Codebase Context",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(ChatService, chatService => {
      chatService.registerContextHandlers(contextHandlers);
    });
    app.waitForService(AgentCommandService, agentCommandService => agentCommandService.addAgentCommands(agentCommands));
    const codebaseService = new CodeBaseService(config.codebase);
    app.addServices(codebaseService);

    for (const [name, resourceConfig] of Object.entries(config.codebase.resources)) {
      switch (resourceConfig.type) {
        case "fileTree":
          codebaseService.registerResource(name, new FileTreeResource(resourceConfig.items));
          break;
        case "repoMap":
          codebaseService.registerResource(name, new RepoMapResource(resourceConfig.items));
          break;
        case "wholeFile":
          codebaseService.registerResource(name, new WholeFileResource(resourceConfig.items));
          break;
      }
    }
  },
  configSchema: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
