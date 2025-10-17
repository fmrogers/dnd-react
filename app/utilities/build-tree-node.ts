import { hasCircularDependency } from '@/app/utilities/has-circular-dependency';
import { objectHasOwnProperty } from '@/app/utilities/object-has-own-property';

export type TreeNode<T> = T & {
  children?: TreeNode<T>[];
};

interface BuildTreeFromArrayOptions {
  /**
   * Whether to throw Error if parent node of an element is not found.
   * @default false
   */
  throwOnInvalidTree?: boolean;
}

/**
 * Builds a tree structure from a flat array of items.
 *
 * @template T - The type of each item in the array.
 * @param items - The flat array of items.
 * @param idKey - The key representing the value of the id of each item, e.g. "id"
 * @param parentIdKey - The key representing the value of the parent id of each item, e.g. "parentId"
 * @param options - Options for strict mode.
 * @returns Array of TreeNodes.
 *
 * @example
 * // Basic usage with id/parentId keys
 * const items = [
 *   { id: 1, parentId: null, name: 'Root' },
 *   { id: 2, parentId: 1, name: 'Child 1' },
 *   { id: 3, parentId: 1, name: 'Child 2' },
 *   { id: 4, parentId: 2, name: 'Grandchild' }
 * ];
 * const tree = buildTreeNodes(items, 'id', 'parentId');
 * // tree = [{ id: 1, ...children: [...] }]
 *
 * @example
 * // Custom keys
 * const items = [
 *   { key: 'a', parent: null },
 *   { key: 'b', parent: 'a' },
 *   { key: 'c', parent: 'b' }
 * ];
 * const tree = buildTreeNodes(items, 'key', 'parent');
 *
 * @example
 * // Strict mode (throws on missing parent)
 * buildTreeNodes(items, 'id', 'parentId', { throwOnInvalidTree: true });
 *
 * @example
 * // TypeScript usage
 * interface Node { id: number; parentId: number | null; name: string }
 * const tree = buildTreeNodes<Node>(items, 'id', 'parentId');
 */
export function buildTreeNodes<T extends object>(
  items: T[],
  idKey: keyof T,
  parentIdKey: keyof T,
  options: BuildTreeFromArrayOptions = {},
): TreeNode<T>[] {
  const { throwOnInvalidTree = false } = options;

  if (!items.length) {
    return [];
  }

  if (throwOnInvalidTree && hasCircularDependency(items, idKey, parentIdKey)) {
    throw new Error('Circular dependency detected');
  }

  // Build lookup table for all nodes using shallow copies
  const lookupTable = new Map<T[typeof idKey], TreeNode<T>>();
  for (const item of items) {
    if (!objectHasOwnProperty(item, idKey)) {
      throw new Error(`Item is missing idKey named '${String(idKey)}'`);
    }

    // Create shallow copy to avoid mutating original items
    const nodeCopy = { ...item };
    lookupTable.set(item[idKey], nodeCopy);
  }

  const rootNodes: TreeNode<T>[] = [];

  // Iterate over values to avoid possible duplicates
  for (const item of lookupTable.values()) {
    const id = item[idKey];
    const parentId = item[parentIdKey];

    const node = lookupTable.get(id);
    if (!node) {
      throw new Error(`Node with id '${id}' not found in lookup table.`);
    }

    if (parentId === undefined || parentId === null) {
      // Root node
      rootNodes.push(node);
      continue;
    }

    const parentNode = lookupTable.get(parentId);
    if (!parentNode) {
      const message = `Parent node with id '${parentId}' not found for node with id '${id}'.`;

      if (throwOnInvalidTree) {
        throw new Error(message);
      }

      rootNodes.push(node);
      continue;
    }

    if (!parentNode.children) {
      parentNode.children = [];
    }

    parentNode.children.push(node);
  }

  return rootNodes;
}
