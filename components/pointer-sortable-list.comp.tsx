'use client';

import { DragOverlay } from '@/components/drag-overlay.comp';
import { InsertionPlaceholder } from '@/components/insertion-placeholder.comp';
import { usePointerDrag } from '@/hooks/use-pointer-drag.hook';
import clsx from 'clsx';
import { useCallback, useRef, useState, type FC, type PointerEvent } from 'react';

interface Item {
  id: string;
  content: string;
}

interface PointerSortableListProps {
  initial: Item[];
}

export const PointerSortableList: FC<PointerSortableListProps> = ({ initial }) => {
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
    beginPointerDrag(id, event.nativeEvent);
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded bg-gray-900">
      {items.map((item, index) => {
        const isSource = drag.isDragging && drag.id === item.id;
        const boundaryBefore = drag.isDragging && drag.overBoundary === index;

        return (
          <div key={item.id} className="flex flex-col">
            {boundaryBefore && <InsertionPlaceholder />}
            <div
              ref={(element) => registerRef(item.id, element)}
              className={clsx(
                'w-120',
                'px-3',
                'py-2',
                'rounded',
                'border-2',
                'border-slate-600',
                'bg-slate-700',
                'flex',
                'items-center',
                'gap-3',
                'transition-opacity',
                'focus: ring',
                isSource && 'opacity-0',
                'pointer-events-none',
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
                )}
                aria-label="Drag handle"
              >
                :::
              </button>
              <div className={clsx('flex-1', 'min-w-0')}>{item.content}</div>
            </div>
          </div>
        );
      })}
      {drag.isDragging && drag.overBoundary === items.length && <InsertionPlaceholder />}

      <DragOverlay drag={drag} renderContent={(id) => items.find((item) => item.id)?.content} />
    </div>
  );
};
