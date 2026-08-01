import { AgentCommandService } from "@tokenring-ai/agent";
import type { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { z } from "zod";
import CodeBaseService from "./CodeBaseService.ts";
import agentCommands from "./commands.ts";
import contextHandlers from "./contextHandlers.ts";
import packageJSON from "./package.json" with { type: "json" };
import { CodeBaseServiceConfigSchema } from "./schema.ts";

const packageConfigSchema = z.object({
  codebase: CodeBaseServiceConfigSchema,
});

export default {
  name: packageJSON.name,
  displayName: "Codebase Context",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app) {
    app.waitForService(ChatService, chatService => {
      chatService.registerContextHandlers(contextHandlers);
    });
    app.waitForService(AgentCommandService, agentCommandService => agentCommandService.addAgentCommands(agentCommands));
    app.addService(new CodeBaseService());
  },
  reconfigure(app, config) {
    app.requireService(CodeBaseService).reconfigure(config.codebase);
  },
  configSchema: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
