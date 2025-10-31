/**
 * Efficiently checks for circular dependencies in a flat array of objects with id and parentId.
 * Returns true if a cycle is found, false otherwise.
 *
 * @template T - The type of each item in the array.
 * @param items - The flat array of items.
 * @param idKey - The key representing the value of the id of each item, e.g. "id"
 * @param parentIdKey - The key representing the value of the parent id of each item, e.g. "parentId"
 * @returns {boolean} True if a circular dependency is found, false otherwise.
 *
 * @example
 * // No circular dependency
 * const items = [
 *   { id: 1, parentId: null },
 *   { id: 2, parentId: 1 },
 *   { id: 3, parentId: 2 }
 * ];
 * hasCircularDependency(items, 'id', 'parentId'); // false
 *
 * @example
 * // Circular dependency (3 -> 1 -> 2 -> 3)
 * const items = [
 *   { id: 1, parentId: 2 },
 *   { id: 2, parentId: 3 },
 *   { id: 3, parentId: 1 }
 * ];
 * hasCircularDependency(items, 'id', 'parentId'); // true
 *
 * @example
 * // Custom keys
 * const items = [
 *   { key: 'a', parent: null },
 *   { key: 'b', parent: 'a' },
 *   { key: 'c', parent: 'b' }
 * ];
 * hasCircularDependency(items, 'key', 'parent'); // false
 *
 * @example
 * // TypeScript usage
 * interface Node { id: number; parentId: number | null }
 * hasCircularDependency<Node>(items, 'id', 'parentId');
 */
export function hasCircularDependency<T extends object>(items: T[], idKey: keyof T, parentIdKey: keyof T): boolean {
  type Key = T[keyof T];

  // Build a map for quick lookup of parent relationships
  const parentMap = new Map<Key, Key | undefined | null>();
  for (const item of items) {
    parentMap.set(item[idKey], item[parentIdKey]);
  }

  // Track visited nodes and recursion stack for cycle detection
  const visited = new Set<Key>();
  const stack = new Set<Key>();

  // Depth-first search to detect cycles
  function visit(id: Key): boolean {
    if (stack.has(id)) return true; // cycle detected
    if (visited.has(id)) return false;

    stack.add(id);
    const parentId = parentMap.get(id);
    if (parentId !== undefined && parentId !== null && parentMap.has(parentId)) {
      if (visit(parentId)) return true;
    }
    stack.delete(id);
    visited.add(id);
    return false;
  }

  // Check each node for cycles
  for (const id of parentMap.keys()) {
    if (visit(id)) return true;
  }

  return false;
}
