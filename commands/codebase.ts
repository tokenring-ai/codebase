import {Agent} from "@tokenring-ai/agent";
import joinDefault from "@tokenring-ai/utility/joinDefault";
import CodeBaseService from "../CodeBaseService.js";

/**
 * /codebase [action] [resources...] - Manage codebase resources in the chat session
 *
 * Actions:
 * - select: Interactive resource selection
 * - enable [resources...]: Enable resources
 * - disable [resources...]: Disable resources  
 * - list: List all resources currently enabled
 * - clear: Remove all resources from the chat session
 * - repo-map: Show the repository map
 */

export const description: string =
  "/codebase [action] [resources...] - Manage codebase resources (select, enable, disable, list, clear, repo-map).";

async function selectResources(
  codebaseService: CodeBaseService,
  agent: Agent,
) {
  const availableResources = codebaseService.getAvailableResources();
  const activeResources = codebaseService.getActiveResourceNames();
  const sortedResources = availableResources.sort((a, b) => a.localeCompare(b));

  const selectedResources: string[] | undefined = await agent.askHuman({
    type: "askForMultipleTreeSelection",
    message: `Current enabled codebase resources: ${joinDefault(", ", activeResources, "(none)")}. Choose codebase resources to enable:`,
    tree: {
      name: "Codebase Resource Selection",
      children: buildResourceTree(sortedResources),
    },
    initialSelection: activeResources,
  });

  if (selectedResources && selectedResources.length > 0) {
    const resourcesToEnable = selectedResources.filter(r => !activeResources.has(r));
    if (resourcesToEnable.length > 0) {
      codebaseService.enableResources(resourcesToEnable);
      agent.infoLine(`Enabled codebase resources: ${resourcesToEnable.join(", ")}`);
    } else {
      agent.infoLine("All selected resources were already enabled.");
    }
  }
}

async function enableResources(
  codebaseService: CodeBaseService,
  agent: Agent,
  resourcesToEnable: string[],
) {
  const availableResources = codebaseService.getAvailableResources();
  const activeResources = codebaseService.getActiveResourceNames();
  
  for (const name of resourcesToEnable) {
    if (!availableResources.includes(name)) {
      agent.errorLine(`Unknown codebase resource: ${name}`);
      return;
    }
  }

  let enabledCount = 0;
  for (const name of resourcesToEnable) {
    if (activeResources.has(name)) {
      agent.infoLine(`Codebase resource '${name}' is already enabled.`);
    } else {
      try {
        codebaseService.enableResources([name]);
        agent.infoLine(`Enabled codebase resource: ${name}`);
        enabledCount++;
      } catch (error) {
        agent.errorLine(`Failed to enable codebase resource '${name}': ${error}`);
      }
    }
  }

  if (enabledCount > 0) {
    agent.infoLine(`Successfully enabled ${enabledCount} resource(s).`);
  }
}

async function listResources(codebaseService: CodeBaseService, agent: Agent) {
  const activeResources = Array.from(codebaseService.getActiveResourceNames());
  
  if (activeResources.length === 0) {
    agent.infoLine("No codebase resources are currently enabled.");
    return;
  }

  agent.infoLine(`Enabled codebase resources:`);
  activeResources.forEach((resource: string, index: number) => {
    agent.infoLine(`  ${index + 1}. ${resource}`);
  });
}

async function showRepoMap(codebaseService: CodeBaseService, agent: Agent) {
  const resources = codebaseService.getActiveResourceNames();
  const hasRepoMapResource = Array.from(resources).some(name => {
    const availableResources = codebaseService.getAvailableResources();
    return availableResources.includes(name) && name.includes("RepoMap");
  });

  if (!hasRepoMapResource) {
    agent.infoLine("No RepoMap resources are currently enabled. Enable a RepoMap resource first.");
    return;
  }

  let found = false;
  for await (const memory of codebaseService.getContextItems(agent)) {
    if (memory.content.includes("snippets of the symbols")) {
      found = true;
      agent.infoLine("Repository map:");
      agent.infoLine(memory.content);
    }
  }

  if (!found) {
    agent.infoLine("No repository map found. Ensure RepoMap resources are configured and enabled.");
  }
}

export async function execute(remainder: string, agent: Agent) {
  const codebaseService = agent.requireServiceByType(CodeBaseService);

  const args = remainder ? remainder.trim().split(/\s+/) : [];
  const action = args[0];
  const actionArgs = args.slice(1);

  switch (action) {
    case "select":
      await selectResources(codebaseService, agent);
      break;

    case "enable":
      await enableResources(codebaseService, agent, actionArgs);
      break;

    case "list":
    case "ls":
      await listResources(codebaseService, agent);
      break;

    case "repo-map":
    case "repomap":
      await showRepoMap(codebaseService, agent);
      break;

    default:
      const helpLines = help();
      helpLines.forEach(line => agent.infoLine(line));
      break;
  }
}

export function help(): string[] {
  return [
    "/codebase [action] [resources...] - Manage codebase resources",
    "  Actions:",
    "    select             - Interactive resource selection",
    "    enable [resources...] - Enable specific resources",
    "    list               - List enabled resources",
    "    repo-map           - Show repository map",
    "",
    "  Examples:",
    "    /codebase select        - Interactive selection",
    "    /codebase enable MyResource - Enable specific resource",
    "    /codebase list          - Show enabled resources",
    "    /codebase repo-map      - Display repository map",
  ];
}

function buildResourceTree(resourceNames: string[]) {
  const children: any[] = [];

  for (const resourceName of resourceNames) {
    const segments = resourceName.split("/");
    let leaf: any[] = children;
    for (let i = 0; i < segments.length; i++) {
      if (i === segments.length - 1) {
        leaf.push({
          name: segments[i],
          value: resourceName,
        });
      } else {
        let child: any = leaf.find(
          (c) => c.name === segments[i] && c.children != null,
        );
        if (!child) {
          child = {
            name: segments[i],
            value: `${segments.slice(0, i + 1).join("/")}/*`,
            children: [],
          };
          leaf.push(child);
        }
        if (!child.children) child.children = [];
        leaf = child.children;
      }
    }
  }
  return children;
}