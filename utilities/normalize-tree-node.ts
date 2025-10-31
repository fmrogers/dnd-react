import type { NormalizedTree } from '@/types/architecture.types';

export const buildNormalizedTreeNode = <T extends { id: string; parentId: string | null }>(
  items: T[],
): NormalizedTree<T> => {
  const nodes: Record<string, T> = {};
  const children: Record<string, string[]> = {};
  const rootIds: string[] = [];

  for (const item of items) {
    nodes[item.id] = item;

    if (item.parentId === null) {
      rootIds.push(item.id);
    } else {
      if (!children[item.parentId]) {
        children[item.parentId] = [];
        children[item.parentId].push(item.id);
      }
    }

    if (!children[item.id]) {
      children[item.id] = [];
    }
  }

  return { nodes, children, rootIds };
};
