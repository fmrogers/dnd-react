import { objectHasOwnProperty } from './object-has-own-property';

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

export function isExpanded(expandedState: Record<string, boolean>, id: unknown) {
  return !objectHasOwnProperty(expandedState, String(id)) || expandedState[String(id)] === true;
}

/**
 * Flattens a tree of nodes into renderable rows honoring expansion state.
 */
export function flattenTreeWithExpandedState<T extends { children?: T[] }, K extends keyof T>(
  treeNodes: T[],
  idKey: K,
  expandedState: Record<string, boolean>,
  ids: T[K][] = [],
  level = 0,
): FlattenTreeNode<T, K>[] {
  return treeNodes.flatMap((node) => [
    { ...node, level, ids: [...ids, node[idKey]] },
    ...(isExpanded(expandedState, node[idKey]) && node.children?.length
      ? flattenTree(node.children, idKey, [...ids, node[idKey]], level + 1)
      : []),
  ]);
}
