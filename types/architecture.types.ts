export type NormalizedTree<T extends { id: string; parentId: string | null }> = {
  nodes: Record<string, T>; // Raw data by id
  children: Record<string, string[]>; // Ordered child id arrays
  rootIds: string[]; // top-level order
};

export type ProjectionEntry<T> = {
  id: string;
  parentId: string | null;
  depth: number;
  isLeaf: boolean;
  isExpanded: boolean;
  indexAmongSiblings: number;
  path: string[]; // ancestor ids root->parent
  original: T; // reference to original node data
};
