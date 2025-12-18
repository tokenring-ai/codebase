import {Agent} from "@tokenring-ai/agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {FileSystemService} from "@tokenring-ai/filesystem";
import CodeBaseService from "../CodeBaseService.js";
import RepoMapResource from "../RepoMapResource.ts";

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

const description: string =
  "/codebase - Manage codebase resources (select, enable, disable, list, clear, repo-map).";

async function selectResources(codebaseService: CodeBaseService, agent: Agent) {
  const availableResources = codebaseService.getAvailableResources();
  const activeResources = codebaseService.getActiveResourceNames();
  const sortedResources = availableResources.sort((a, b) => a.localeCompare(b));

  const selectedResources: string[] | null = await agent.askHuman({
    type: "askForMultipleTreeSelection",
    title: "Codebase Resource Selection",
    message: `Select resources to include in your chat context`,
    tree: {
      name: "Codebase Resource Selection",
      children: buildResourceTree(sortedResources),
    },
    initialSelection: Array.from(activeResources),
  });

  if (selectedResources && selectedResources.length > 0) {
    const resourcesToEnable = selectedResources.filter(
      (r) => !activeResources.has(r),
    );
    if (resourcesToEnable.length > 0) {
      codebaseService.enableResources(resourcesToEnable);
      agent.infoLine(
        `Enabled codebase resources: ${resourcesToEnable.join(", ")}`,
      );
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
        agent.errorLine(
          `Failed to enable codebase resource '${name}': ${error}`,
        );
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
  const fileSystem = agent.requireServiceByType(FileSystemService);

  const repoMaps = Object.entries(codebaseService.resourceRegistry.getActiveItemEntries())
    .filter(([name, resource]) => resource instanceof RepoMapResource)
    .map(([name,resource]) => resource);

  if (repoMaps.length === 0) {
    agent.infoLine(
      "No RepoMap resources are currently enabled. Enable a RepoMap resource first.",
    );
    return;
  }

  const repoMapFiles = new Set<string>();

  for (const resource of repoMaps) {
    await resource.addFilesToSet(repoMapFiles, agent);
  }

  if (repoMapFiles.size > 0) {
    const repoMap = await codebaseService.generateRepoMap(
      repoMapFiles,
      fileSystem,
      agent,
    );

    if (repoMap) {
      agent.chatOutput("Repository map:\n");
      agent.infoLine(repoMap);
      return;
    }
  }

  agent.infoLine(
    "No repository map found. Ensure RepoMap resources are configured and enabled.",
  );
}

async function execute(remainder: string, agent: Agent) {
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
      agent.chatOutput(help);
      break;
  }
}

const help = `
# /codebase - Codebase Resource Management

**Usage:** \`/codebase [action] [resources...]\`

Manage codebase resources in your chat session. Resources include source code documentation, API references, and other code-related materials that help the AI understand and work with your codebase.

## Available Actions

| Action | Description |
|--------|-------------|
| **select** | Interactive resource selection via tree view (recommended for exploring available resources) |
| **enable [resources...]** | Enable specific codebase resources by name<br>Example: \`/codebase enable src/utils src/types\` |
| **disable [resources...]** | Disable specific codebase resources<br>Example: \`/codebase disable src/utils\` |
| **list, ls** | List all currently enabled codebase resources |
| **clear** | Remove all codebase resources from the session |
| **repo-map, repomap** | Display the repository map and structure |

## Common Usage Examples

- \`/codebase select\` - Browse and select resources interactively
- \`/codebase enable\` - Enable all available resources
- \`/codebase enable src\` - Enable all resources under src/ directory
- \`/codebase enable api docs\` - Enable specific resources by name
- \`/codebase list\` - Show currently enabled resources
- \`/codebase repo-map\` - View repository structure and symbols

## Notes

- Resources are organized hierarchically (e.g., src/components, src/utils)
- Use 'select' for exploring available resources when unsure of exact names
- RepoMap functionality requires RepoMap resources to be enabled first
- Changes to resource availability persist across chat sessions

## Troubleshooting

- **Unknown resource names:** Use \`/codebase select\` to see available options
- **RepoMap not showing:** Ensure RepoMap resources are enabled
- **Permission errors:** Check resource access permissions in your codebase
`;

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

export default {
  description,
  execute,
  help,
} satisfies TokenRingAgentCommand