import {ContextHandler} from "@tokenring-ai/chat/schema";
import codebaseContext from "./contextHandlers/codebaseContext.ts";

export default {
  'codebase-context': codebaseContext,
} as Record<string, ContextHandler>;
