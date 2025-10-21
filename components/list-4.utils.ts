export function placeItemsBeforeTarget<T extends { children?: T[] }, K extends keyof T>(
  items: T[],
  idKey: K,
  draggedItemIdsPath: T[K][],
  droppedBeforeItemIdsPath: T[K][],
): T[] {
  if (!draggedItemIdsPath.length || !droppedBeforeItemIdsPath.length) return items;

  // Deep clone minimally (structure only) to keep immutability
  const clone = (nodes: T[]): T[] => nodes.map((n) => ({ ...n, children: n.children ? clone(n.children) : undefined }));
  const working = clone(items);

  // Helper: locate node by path, returning { parentArray, index }
  const locate = (path: T[K][], workingItems: T[]): { parent: T[]; index: number } | null => {
    let parent: T[] = workingItems;
    let node: T | undefined;
    for (let i = 0; i < path.length; i++) {
      const id = path[i];
      const idx = parent.findIndex((c) => c[idKey] === id);
      if (idx === -1) return null;
      node = parent[idx];
      if (i === path.length - 1) return { parent, index: idx };
      parent = node.children ?? [];
    }
    return null;
  };

  // First locate both items before any modifications
  const draggedLoc = locate(draggedItemIdsPath, working);
  if (!draggedLoc) {
    // Check if this is an invalid child path (contains multiple elements)
    if (draggedItemIdsPath.length > 1) {
      throw new Error(`Cannot find dragged item with id ${String(draggedItemIdsPath.at(-1))}`);
    }
    // Silently return original items if dragged item not found at root level
    return items;
  }

  const targetLoc = locate(droppedBeforeItemIdsPath, working);
  if (!targetLoc) {
    throw new Error(`Cannot find dropped-on item with id ${String(droppedBeforeItemIdsPath.at(-1))}`);
  }

  const draggedItem = draggedLoc.parent[draggedLoc.index];

  // Check if we're moving within the same parent
  const sameParent = draggedLoc.parent === targetLoc.parent;

  // Remove dragged item from its current position
  draggedLoc.parent.splice(draggedLoc.index, 1);

  // Calculate the correct insertion index
  let insertIndex = targetLoc.index + 1;

  // If moving within the same parent and the dragged item was before the target,
  // we need to adjust the insertion index because removal shifted everything
  if (sameParent && draggedLoc.index < targetLoc.index) {
    insertIndex = targetLoc.index; // No +1 needed because we removed an item before target
  }

  // Insert the dragged item at the calculated position
  targetLoc.parent.splice(insertIndex, 0, draggedItem);

  return working;
}

/**
 * Moves an item to become a child of the target item
 */
export function moveItemAsChild<T extends { children?: T[] }, K extends keyof T>(
  items: T[],
  idKey: K,
  draggedItemIdsPath: T[K][],
  targetItemIdsPath: T[K][],
): T[] {
  if (!draggedItemIdsPath.length || !targetItemIdsPath.length) return items;

  // Check if trying to drop item on itself
  const isDroppedOnItself =
    draggedItemIdsPath.length === targetItemIdsPath.length &&
    draggedItemIdsPath.every((id, index) => id === targetItemIdsPath[index]);

  if (isDroppedOnItself) {
    return items;
  }

  // Deep clone to maintain immutability
  const clone = (nodes: T[]): T[] => nodes.map((n) => ({ ...n, children: n.children ? clone(n.children) : undefined }));
  const working = clone(items);

  // Helper: locate node by path, returning { parentArray, index }
  const locate = (path: T[K][], workingItems: T[]): { parent: T[]; index: number; node: T } | null => {
    let parent: T[] = workingItems;
    let node: T | undefined;
    for (let i = 0; i < path.length; i++) {
      const id = path[i];
      const idx = parent.findIndex((c) => c[idKey] === id);
      if (idx === -1) return null;
      node = parent[idx];
      if (i === path.length - 1) return { parent, index: idx, node };
      parent = node.children ?? [];
    }
    return null;
  };

  // Locate the dragged item
  const draggedLoc = locate(draggedItemIdsPath, working);
  if (!draggedLoc) {
    // Check if this is an invalid child path
    if (draggedItemIdsPath.length > 1) {
      throw new Error(`Cannot find dragged item with id ${String(draggedItemIdsPath.at(-1))}`);
    }
    return items;
  }

  // Locate the target item
  const targetLoc = locate(targetItemIdsPath, working);
  if (!targetLoc) {
    throw new Error(`Cannot find target item with id ${String(targetItemIdsPath.at(-1))}`);
  }

  // Check for circular dependency (target is a descendant of dragged item)
  // This happens when target path starts with dragged path
  const wouldCreateCircularDependency =
    targetItemIdsPath.length > draggedItemIdsPath.length &&
    draggedItemIdsPath.every((id, index) => targetItemIdsPath[index] === id);

  if (wouldCreateCircularDependency) {
    throw new Error('Cannot move item: would create circular dependency');
  }

  const draggedItem = draggedLoc.node;

  // Remove dragged item from its current position
  draggedLoc.parent.splice(draggedLoc.index, 1);

  // Add dragged item as a child of the target item
  const targetItem = targetLoc.node;
  if (!targetItem.children) {
    targetItem.children = [];
  }
  targetItem.children.push(draggedItem);

  return working;
}
