import type { TreeLeaf } from "@tokenring-ai/agent/question";

export function buildResourceTree(resourceNames: string[]): TreeLeaf[] {
  const categories: Record<string, Array<{ displayName: string; resourceName: string }>> = {};

  for (const resourceName of resourceNames) {
    const match = resourceName.match(/^(.*)\/(.*)/) as [string, string, string] | undefined;
    const category = match ? match[1] : "Unknown";
    const displayName = match ? match[2] : resourceName;

    (categories[category] ??= []).push({ displayName, resourceName });
  }

  return Object.entries(categories)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, items]) => ({
      name: `${category}`,
      children: items.map(item => ({
        name: `${item.displayName}`,
        value: item.resourceName,
      })),
    }));
}
