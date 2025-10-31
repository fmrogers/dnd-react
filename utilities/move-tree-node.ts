import type { TreeNode } from '@/utilities/build-tree-node';

export type TreeDropIntent =
  | { type: 'before'; targetId: string }
  | { type: 'after'; targetId: string }
  | { type: 'inside'; targetId: string };

interface MoveTreeNodeArgs<T extends Record<string, any>> {
  roots: TreeNode<T>[]; // mutable tree roots (will be mutated)
  nodeId: string; // id of node being moved
  target: TreeDropIntent; // drop location intent
  getId: (node: TreeNode<T>) => string;
  parentIdKey: keyof T; // key for parentId field
}

/**
 * Returns new shallow-cloned roots array after performing move.
 * NOTE: This mutates the provided roots structure; follow with a clone if deep immutability is needed.
 */
export function moveTreeNode<T extends Record<string, any>>({
  roots,
  nodeId,
  target,
  getId,
  parentIdKey,
}: MoveTreeNodeArgs<T>): TreeNode<T>[] {
  const idToNode = new Map<string, TreeNode<T>>();
  const idToParent = new Map<string, TreeNode<T> | null>();

  const indexTree = (list: TreeNode<T>[], parent: TreeNode<T> | null) => {
    list.forEach((n) => {
      const id = getId(n);
      idToNode.set(id, n);
      idToParent.set(id, parent);
      if (n.children) indexTree(n.children, n);
    });
  };
  indexTree(roots, null);

  const moving = idToNode.get(nodeId);
  if (!moving) return roots.slice();

  const targetNode = idToNode.get(target.targetId);
  if (!targetNode) return roots.slice();

  // Prevent dropping inside its own descendant
  if (target.type === 'inside' && isDescendant(idToNode, target.targetId, nodeId)) {
    return roots.slice();
  }

  // Remove moving node from current parent list
  const currentParent = idToParent.get(nodeId);
  const sourceArray = currentParent ? currentParent.children! : roots;
  const removeIndex = sourceArray.findIndex((c) => getId(c) === nodeId);
  if (removeIndex >= 0) sourceArray.splice(removeIndex, 1);

  let destinationArray: TreeNode<T>[];
  let insertIndex: number;

  if (target.type === 'inside') {
    // Insert as last child of target node
    if (!targetNode.children) targetNode.children = [];
    destinationArray = targetNode.children;
    insertIndex = destinationArray.length;
    (moving as any)[parentIdKey] = target.targetId;
  } else {
    const anchorParent = idToParent.get(target.targetId);
    destinationArray = anchorParent ? anchorParent.children! : roots;
    const anchorIndex = destinationArray.findIndex((c) => getId(c) === target.targetId);
    insertIndex = target.type === 'before' ? anchorIndex : anchorIndex + 1;
    const newParentId = anchorParent ? getId(anchorParent) : null;
    (moving as any)[parentIdKey] = newParentId;
  }

  destinationArray.splice(insertIndex, 0, moving);

  return roots.slice(); // shallow clone roots array for external state update
}

/** Checks if candidateId node is a descendant of ancestorId node. */
export function isDescendant<T>(map: Map<string, TreeNode<T>>, ancestorId: string, candidateId: string): boolean {
  if (ancestorId === candidateId) return true;
  const ancestor = map.get(ancestorId);
  if (!ancestor || !ancestor.children) return false;
  for (const child of ancestor.children) {
    const childId = (child as any).id;
    if (childId === candidateId) return true;
    if (isDescendant(map, childId, candidateId)) return true;
  }
  return false;
}
