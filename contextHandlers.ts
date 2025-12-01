import {ContextHandler} from "@tokenring-ai/chat/types";
import {default as codebaseContext} from "./contextHandlers/codebaseContext.ts";

export default {
  'codebase-context': codebaseContext,
} as Record<string, ContextHandler>;
