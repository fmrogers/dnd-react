'use client';

import { DragOverlay } from '@/components/drag-overlay.comp';
import { DraggableHandle } from '@/components/draggable-handle.comp';
import { InsertionPlaceholder } from '@/components/insertion-placeholder.comp';
import { usePointerDrag } from '@/hooks/use-pointer-drag.hook';
import type { MockData } from '@/mock-data';
import { buildTreeNodes } from '@/utilities/build-tree-node';
import { buildNormalizedTreeNode } from '@/utilities/normalize-tree-node';
import clsx from 'clsx';
import { useCallback, useRef, useState, type FC, type PointerEvent } from 'react';

interface Item {
  id: string;
  content: string;
}

interface PointerSortableListProps {
  initial: MockData;
}

export const PointerSortableList: FC<PointerSortableListProps> = ({ initial }) => {
  console.log(buildTreeNodes(initial, 'id', 'parentId'));
  const [tree, setTree] = useState(() => buildNormalizedTreeNode(initial));
  console.log(tree);
  const [items, setItems] = useState<Item[]>(initial);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  const registerRef = useCallback((id: string, element: HTMLElement | null) => {
    refs.current[id] = element;
  }, []);

  const { drag, beginPointerDrag } = usePointerDrag<Item>({
    items,
    getId: (item) => item.id,
    itemRefs: refs,
    onReorder: setItems,
    activationDistance: 3,
  });

  const handlePointerDown = (event: PointerEvent, id: string) => {
    if (event.button !== 0) return;
    // If there is an active text selection, do NOT start a drag (allow selection usage)
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return; // user is highlighting text; skip drag activation
    }
    beginPointerDrag(id, event.nativeEvent);
  };

  // Prevent any accidental native dragstart bubbling from text nodes or images
  const suppressNativeDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Build a flat array of children (placeholders and items) as direct siblings
  const children: React.ReactNode[] = [];
  items.forEach((item, index) => {
    const isSource = drag.isDragging && drag.id === item.id;
    const boundaryBefore = drag.isDragging && drag.overBoundary === index;

    if (boundaryBefore) {
      children.push(<InsertionPlaceholder key={`ph-${index}`} isDragging={drag.isDragging} />);
    }

    if (!isSource) {
      children.push(
        <div
          key={item.id}
          ref={(element) => registerRef(item.id, element)}
          className={clsx(
            'w-120',
            'px-3',
            'py-2',
            'rounded',
            'border-2',
            'border-slate-500',
            'bg-slate-700',
            'flex',
            'items-center',
            'gap-3',
          )}
        >
          <button
            type="button"
            onPointerDown={(event) => handlePointerDown(event, item.id)}
            className={clsx(
              'p-1',
              'cursor-grab',
              'active:cursor-grabbing',
              'rounded',
              'hover:bg-slate-500',
              'focus:outline-none',
              'focus:ring',
              'focus:ring-slate-500/50',
              'select-none',
            )}
            aria-label="Drag handle"
          >
            <DraggableHandle />
          </button>
          <div className={clsx('flex-1', 'min-w-0')}>{item.content}</div>
        </div>,
      );
    }
  });
  if (drag.isDragging && drag.overBoundary === items.length) {
    children.push(<InsertionPlaceholder key={`ph-end`} isDragging={drag.isDragging} />);
  }

  return (
    <div className="p-4 rounded bg-gray-900" onDragStart={suppressNativeDrag}>
      <div className="sortable-list flex flex-col">{children}</div>
      <DragOverlay drag={drag} renderContent={(id) => items.find((item) => item.id === id)?.content} />
    </div>
  );
};
