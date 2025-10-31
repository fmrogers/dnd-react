import type { NormalizedTree, ProjectionEntry } from '@/types/architecture.types';

export const flattenVisibleNodes = <T extends { id: string; parentId: string | null }>(
  tree: NormalizedTree<T>,
  expanded: Record<string, boolean>,
): ProjectionEntry<T>[] => {
  const projection: ProjectionEntry<T>[] = [];

  const visit = (id: string, depth: number, path: string[]) => {
    const node = tree.nodes[id];
    const children = tree.children[id] || [];
    const isExpanded = !!expanded[id];

    projection.push({
      id,
      parentId: node.parentId,
      depth,
      isLeaf: children.length === 0,
      isExpanded,
      indexAmongSiblings: path.length ? tree.children[path[path.length - 1]].indexOf(id) : tree.rootIds.indexOf(id),
      path,
      original: node,
    });

    if (isExpanded) {
      for (const childId of children) {
        visit(childId, depth + 1, [...path, id]);
      }
    }
  };

  for (const rootId of tree.rootIds) {
    visit(rootId, 0, []);
  }

  return projection;
};
