import { PointerSortableList } from '@/components/pointer-sortable-list.comp';
import { flattenVisibleNodes } from '@/utilities/flatten-visible-nodes';
import { buildNormalizedTreeNode } from '@/utilities/normalize-tree-node';
import { useEffect, useMemo, useState, type FC } from 'react';

interface SortableTreeNodesProps {
  items: {
    id: string;
    parentId: string | null;
    name: string;
  }[];
}

export const SortableTreeNodes: FC<SortableTreeNodesProps> = ({ items }) => {
  const [tree, setTree] = useState(() => buildNormalizedTreeNode(items));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const projection = useMemo(() => flattenVisibleNodes(tree, expanded), [tree, expanded])

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      return {
        ...prev,
        [id]: !prev[id],
      };
    });
  };

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const id of tree.rootIds) {
        next[id] = true;
      }
      return next;
    })
  }, [tree.rootIds])

  return <PointerSortableList items={projection} getId={} />
};
