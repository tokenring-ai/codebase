import {ChatService, HumanInterfaceService} from "@token-ring/chat";
import {Registry} from "@token-ring/registry";
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
  registry: Registry,
): Promise<void> {
  const chatService = registry.requireFirstServiceByType(ChatService);
  const humanInterfaceService = registry.getFirstServiceByType(
    HumanInterfaceService,
  );
  const codeBaseService = registry.requireFirstServiceByType(CodeBaseService);


  const availableResources: string[] = codeBaseService.getAvailableResources();
  const activeResources: string[] = Array.from(codeBaseService.getActiveResourceNames());

  // Handle direct resource operations, e.g. /codebaseResources enable foo bar
  const directOperation = remainder?.trim();
  if (directOperation) {
    const parts = directOperation.split(/\s+/);
    const operation = parts[0];
    const resourceNames = parts.slice(1);

    if (!["enable", "set"].includes(operation)) {
      chatService.errorLine(
        "Unknown operation. Usage: /codebaseResources [enable|set] <resource1> <resource2> ...",
      );
      return;
    }

    // Validate resource names
    for (const name of resourceNames) {
      if (!availableResources.includes(name)) {
        chatService.errorLine(`Unknown codebase resource: ${name}`);
        return;
      }
    }

    switch (operation) {
      case "enable": {
        let changed = false;
        for (const name of resourceNames) {
          if (activeResources.includes(name)) {
            chatService.systemLine(`Codebase resource '${name}' is already enabled.`);
          } else {
            try {
              codeBaseService.enableResources(name);
              changed = true;
              chatService.systemLine(`Enabled codebase resource: ${name}`);
            } catch (error) {
              chatService.errorLine(`Failed to enable codebase resource '${name}': ${error}`);
            }
          }
        }
        if (!changed) chatService.systemLine("No codebase resources were enabled.");
        break;
      }
      case "set": {
        // Clear all active resources first, then enable the specified ones
        try {
          // Since CodeBaseService doesn't have a clear method, we'll need to work around this
          // For now, we'll enable the new resources (they will be added to the active set)
          codeBaseService.enableResources(...resourceNames);

          chatService.systemLine("Set codebase resources to: " + resourceNames.join(", "));
          chatService.systemLine("Note: Previous resources are still active. CodeBaseService needs a clear/reset method for full 'set' functionality.");
        } catch (error) {
          chatService.errorLine(`Failed to set codebase resources: ${error}`);
        }
        break;
      }
    }

    chatService.systemLine(
      "Current enabled codebase resources: " +
      (Array.from(codeBaseService.getActiveResourceNames()).join(" ") || "none"),
    );
    return;
  }

  // If no remainder provided, show interactive multi-selection
  if (!humanInterfaceService) {
    chatService.systemLine("Available codebase resources: " + availableResources.join(", "));
    chatService.systemLine("Currently enabled: " + (activeResources.join(", ") || "none"));
    chatService.systemLine("Use: /codebaseResources enable <resource1> <resource2> ... to enable resources");
    return;
  }

  const sortedResources = availableResources.sort((a, b) => a.localeCompare(b));

  // Interactive multi-selection if no operation is provided in the command
  try {
    const selectedResources = await humanInterfaceService.askForMultipleTreeSelection({
      message: `Current enabled codebase resources: ${activeResources.join(", ") || "none"}. Choose codebase resources to enable:`,
      tree: {
        name: "Codebase Resource Selection",
        children: buildResourceTree(sortedResources),
      },
      initialSelection: activeResources,
    });

    if (selectedResources && selectedResources.length > 0) {
      try {
        // Enable all selected resources
        const resourcesToEnable = selectedResources.filter(r => !activeResources.includes(r));

        if (resourcesToEnable.length > 0) {
          codeBaseService.enableResources(...resourcesToEnable);
          chatService.systemLine(`Enabled codebase resources: ${resourcesToEnable.join(", ")}`);
        } else {
          chatService.systemLine("All selected resources were already enabled.");
        }

        chatService.systemLine(
          "Current enabled codebase resources: " +
          Array.from(codeBaseService.getActiveResourceNames()).join(", ")
        );
      } catch (error) {
        chatService.errorLine(`Error enabling codebase resources: ${error}`);
      }
    } else if (selectedResources && selectedResources.length === 0) {
      chatService.systemLine("No resources selected. Current state unchanged.");
    } else {
      chatService.systemLine("Codebase resource selection cancelled. No changes made.");
    }
  } catch (error) {
    chatService.errorLine(`Error during codebase resource selection:`, error);
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