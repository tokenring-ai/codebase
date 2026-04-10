import type {TreeLeaf} from "@tokenring-ai/agent/question";

export function buildResourceTree(resourceNames: string[]): TreeLeaf[] {
  const categories: Record<
    string,
    Array<{ displayName: string; resourceName: string }>
  > = {};

  for (const resourceName of resourceNames) {
    const match = resourceName.match(/^(.*)\/(.*)/);
    const category = match ? match[1] : "Unknown";
    const displayName = match ? match[2] : resourceName;

    (categories[category] ??= []).push({displayName, resourceName});
  }

  return Object.keys(categories)
    .sort()
    .map((category) => ({
      name: `${category}`,
      children: categories[category].map((item) => ({
        name: `${item.displayName}`,
        value: item.resourceName,
      })),
    }));
}
