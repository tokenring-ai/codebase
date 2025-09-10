import {Agent} from "@tokenring-ai/agent";
import joinDefault from "@tokenring-ai/utility/joinDefault";
import CodeBaseService from "../CodeBaseService.js";

/**
 * Usage:
 *   /codebaseResources [enable|set] <resource1> <resource2> ...
 *   /codebaseResources                     - shows interactive resource selection
 *   /codebaseResources enable foo bar      - enables foo and bar codebase resources
 *   /codebaseResources set a b c           - sets enabled codebase resources to a, b, c
 */

export const description =
  "/codebaseResources [enable|set] <resource1> <resource2> ... - List, enable, or set enabled codebase resources." as const;

export async function execute(
  remainder: string | undefined,
  agent: Agent,
): Promise<void> {
  const codeBaseService = agent.requireFirstServiceByType(CodeBaseService);


  const availableResources = codeBaseService.getAvailableResources();
  const activeResources = codeBaseService.getActiveResourceNames();

  // Handle direct resource operations, e.g. /codebaseResources enable foo bar
  const directOperation = remainder?.trim();
  if (directOperation) {
    const parts = directOperation.split(/\s+/);
    const operation = parts[0];
    const resourceNames = parts.slice(1);

    if (!["enable", "set"].includes(operation)) {
      agent.errorLine(
        "Unknown operation. Usage: /codebaseResources [enable|set] <resource1> <resource2> ...",
      );
      return;
    }

    // Validate resource names
    for (const name of resourceNames) {
      if (!availableResources.includes(name)) {
        agent.errorLine(`Unknown codebase resource: ${name}`);
        return;
      }
    }

    switch (operation) {
      case "enable": {
        let changed = false;
        for (const name of resourceNames) {
          if (activeResources.has(name)) {
            agent.infoLine(`Codebase resource '${name}' is already enabled.`);
          } else {
            try {
              codeBaseService.enableResources(name);
              changed = true;
              agent.infoLine(`Enabled codebase resource: ${name}`);
            } catch (error) {
              agent.errorLine(`Failed to enable codebase resource '${name}': ${error}`);
            }
          }
        }
        if (!changed) agent.infoLine("No codebase resources were enabled.");
        break;
      }
      case "set": {
        // Clear all active resources first, then enable the specified ones
        try {
          // Since CodeBaseService doesn't have a clear method, we'll need to work around this
          // For now, we'll enable the new resources (they will be added to the active set)
          codeBaseService.enableResources(resourceNames);

          agent.infoLine("Set codebase resources to: " + resourceNames.join(", "));
          agent.infoLine("Note: Previous resources are still active. CodeBaseService needs a clear/reset method for full 'set' functionality.");
        } catch (error) {
          agent.errorLine(`Failed to set codebase resources: ${error}`);
        }
        break;
      }
    }

    agent.infoLine(
      `Current enabled codebase resources: ${joinDefault(", ", codeBaseService.getActiveResourceNames(), "(none)")}`,
    );
    return;
  }


  const sortedResources = availableResources.sort((a, b) => a.localeCompare(b));

  // Interactive multi-selection if no operation is provided in the command
  try {
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
      try {
        // Enable all selected resources
        const resourcesToEnable = selectedResources.filter(r => !activeResources.has(r));

        if (resourcesToEnable.length > 0) {
          codeBaseService.enableResources(resourcesToEnable);
          agent.infoLine(`Enabled codebase resources: ${resourcesToEnable.join(", ")}`);
        } else {
          agent.infoLine("All selected resources were already enabled.");
        }

        agent.infoLine(
          "Current enabled codebase resources: " +
          Array.from(codeBaseService.getActiveResourceNames()).join(", ")
        );
      } catch (error) {
        agent.errorLine(`Error enabling codebase resources: ${error}`);
      }
    } else if (selectedResources && selectedResources.length === 0) {
      agent.infoLine("No resources selected. Current state unchanged.");
    } else {
      agent.infoLine("Codebase resource selection cancelled. No changes made.");
    }
  } catch (error) {
    agent.errorLine(`Error during codebase resource selection:`, error as Error);
  }
}

// noinspection JSUnusedGlobalSymbols
export function help(): string[] {
  return [
    "/codebaseResources [enable|set] <resource1> <resource2> ...",
    "  - With no arguments: Shows interactive multi-selection for codebase resources",
    "  - enable: Enable specific codebase resources",
    "  - set: Set exactly which codebase resources are enabled (limited - doesn't clear existing)",
    "",
    "Codebase resources control which file patterns and matches are active in the codebase service.",
    "These resources determine what files are included when generating memories for the AI context.",
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