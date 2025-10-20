export type FlattenTreeNode<T, K extends keyof T> = T & { level: number; ids: T[K][] };

/**
 * Flattens a tree of nodes into renderable rows honoring expansion state.
 */
export function flattenTree<T extends { children?: T[] }, K extends keyof T>(
  treeNodes: T[],
  idKey: K,
  ids: T[K][] = [],
  level = 0,
): FlattenTreeNode<T, K>[] {
  return treeNodes.flatMap((node) => [
    { ...node, level, ids: [...ids, node[idKey]] },
    ...(node.children?.length ? flattenTree(node.children, idKey, [...ids, node[idKey]], level + 1) : []),
  ]);
}
