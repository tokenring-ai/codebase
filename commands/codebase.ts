import {Agent} from "@tokenring-ai/agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import createSubcommandRouter from "@tokenring-ai/agent/util/subcommandRouter";
import numberedList from "@tokenring-ai/utility/string/numberedList";
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

async function selectResources(remainder: string, agent: Agent) {
  const codebaseService = agent.requireServiceByType(CodeBaseService);
  const availableResources = codebaseService.getAvailableResources();
  const activeResources = codebaseService.getEnabledResourceNames(agent);
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
    const enabledResources = codebaseService.setEnabledResources(selectedResources, agent);
    agent.infoMessage(
      `Currently enabled codebase resources: ${Array.from(enabledResources).join(", ")}`,
    );
  }
}

async function enableResources(
  remainder: string,
  agent: Agent
) {
  const codebaseService = agent.requireServiceByType(CodeBaseService);
  const resourcesToEnable = remainder.split(/\s+/).filter(Boolean);

  const enabledResources = codebaseService.enableResources(resourcesToEnable, agent);
  agent.infoMessage(`Currently enabled codebase resources: ${Array.from(enabledResources).join(", ")}`)
}

async function disableResources(
  remainder: string,
  agent: Agent
) {
  const codebaseService = agent.requireServiceByType(CodeBaseService);
  const resourcesToDisable = remainder.split(/\s+/).filter(Boolean);
  const disabledResources = codebaseService.disableResources(resourcesToDisable, agent);
  agent.infoMessage(`Currently enabled codebase resources: ${Array.from(disabledResources).join(", ")}`)
}

async function setResources(remainder: string, agent: Agent) {
  const codebaseService = agent.requireServiceByType(CodeBaseService);
  const resourcesToSet = remainder.split(/\s+/).filter(Boolean);
  const setResources = codebaseService.setEnabledResources(resourcesToSet, agent);
  agent.infoMessage(`Currently enabled codebase resources: ${Array.from(setResources).join(", ")}`)
}

async function listResources(remainder: string, agent: Agent) {
  const codebaseService = agent.requireServiceByType(CodeBaseService);
  const activeResources = Array.from(codebaseService.getEnabledResourceNames(agent));

  if (activeResources.length === 0) {
    agent.infoMessage("No codebase resources are currently enabled.");
    return;
  }

  const lines: string[] = [
    "Enabled codebase resources:",
    numberedList(activeResources)
  ];
  agent.infoMessage(lines.join("\n"));
}

async function showRepoMap(remainder: string, agent: Agent) {
  const codebaseService = agent.requireServiceByType(CodeBaseService);
  const fileSystem = agent.requireServiceByType(FileSystemService);

  const repoMaps = Object.values(codebaseService.getEnabledResources(agent))
    .filter(resource => resource instanceof RepoMapResource);

  if (repoMaps.length === 0) {
    agent.infoMessage(
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
      agent.infoMessage(repoMap);
      return;
    }
  }

  agent.infoMessage(
    "No repository map found. Ensure RepoMap resources are configured and enabled.",
  );
}

const execute = createSubcommandRouter({
  select: selectResources,
  enable: enableResources,
  disable: disableResources,
  set: setResources,
  list: listResources,
  show: createSubcommandRouter({
    repo: showRepoMap,
  }),
});

const help = `
# /codebase - Codebase Resource Management

**Usage:** \`/codebase [action] [resources...]\`

Manage codebase resources in your chat session. Resources include source code documentation, API references, and other code-related materials that help the AI understand and work with your codebase.

## Available Actions

| Action | Description |
|--------|-------------|
| **select** | Interactive resource selection via tree view (recommended for exploring available resources) |
| **enable** | Enable specific codebase resources by name<br>Example: \`/codebase enable src/utils src/types\` |
| **disable** | Disable specific codebase resources<br>Example: \`/codebase disable src/utils\` |
| **set** | Set specific codebase resources by name<br>Example: \`/codebase set src/utils src/types\` |
| **list** | List all currently enabled codebase resources |
| **clear** | Remove all codebase resources from the session |
| **show repo** | Display the currently enabled repository map and structure |

## Common Usage Examples

- \`/codebase select\` - Browse and select resources interactively
- \`/codebase set src/docs\` - Set specific codebase resources by name
- \`/codebase enable src\/\*\` - Enable all resources under src/ directory
- \`/codebase enable api docs\` - Enable specific resources by name
- \`/codebase disable src/\*\` - Disable specific resources by name
- \`/codebase list\` - Show currently enabled resources
- \`/codebase show repo\` - View repository structure and symbols

## Notes

- Resources are organized hierarchically (e.g., src/components, src/utils)
- Use 'select' for exploring available resources when unsure of exact names
- RepoMap functionality requires RepoMap resources to be enabled first

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