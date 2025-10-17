import type { TreeNode } from '@/app/utilities/build-tree-node';

export interface FlatTreeRow<T> {
  id: string;
  parentId: string | null;
  depth: number;
  siblingIndex: number;
  flatIndex: number;
  childCount: number;
  node: TreeNode<T>;
  expanded: boolean;
  path: string;
  inDragSubtree?: boolean;
}

/** Options passed to flattenTree */
export interface FlattenTreeOptions<T> {
  expanded: Set<string>; // ids that are expanded
  getId: (node: TreeNode<T>) => string;
  getParentId: (node: TreeNode<T>) => string | null;
  dragRootId?: string; // id of subtree root being dragged
}

/**
 * Flattens a tree of nodes into renderable rows honoring expansion state.
 */
export function flattenTree<T>(
  roots: TreeNode<T>[],
  { expanded, getId, getParentId, dragRootId }: FlattenTreeOptions<T>,
): FlatTreeRow<T>[] {
  const flat: FlatTreeRow<T>[] = [];
  const stack: Array<{ node: TreeNode<T>; depth: number; parentId: string | null; siblingIndex: number; path: string }> = [];

  // Prime stack with roots
  roots.forEach((n, i) =>
    stack.push({ node: n, depth: 0, parentId: getParentId(n), siblingIndex: i, path: getId(n) }),
  );

  // Identify subtree nodes if dragging a parent
  const subtreeIds = new Set<string>();
  if (dragRootId) {
    const mark = (node: TreeNode<T>) => {
      const id = getId(node);
      subtreeIds.add(id);
      node.children?.forEach(mark);
    };
    const locate = (list: TreeNode<T>[]) => {
      for (const n of list) {
        if (getId(n) === dragRootId) {
          mark(n);
          break;
        }
        n.children && locate(n.children);
      }
    };
    locate(roots);
  }

  while (stack.length) {
    const current = stack.pop()!;
    const id = getId(current.node);
    const children = current.node.children || [];
    const isExpanded = expanded.has(id);

    flat.push({
      id,
      parentId: current.parentId,
      depth: current.depth,
      siblingIndex: current.siblingIndex,
      flatIndex: flat.length, // provisional
      childCount: children.length,
      node: current.node,
      expanded: isExpanded,
      path: current.path,
      inDragSubtree: subtreeIds.has(id) && dragRootId !== id,
    });

    if (isExpanded && children.length) {
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        stack.push({
          node: child,
          depth: current.depth + 1,
          parentId: id,
          siblingIndex: i,
          path: `${current.path}/${getId(child)}`,
        });
      }
    }
  }

  // Ensure consistent flatIndex values
  return flat.map((row, i) => ({ ...row, flatIndex: i }));
}
