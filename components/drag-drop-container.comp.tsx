'use client';

import type { DraggedItemPosition } from '@/components/dnd.types';
import { computeTargetFromBoundary, reorder } from '@/components/dnd.utils';
import { DraggableItemPreview } from '@/components/draggable-item-preview.comp';
import { DraggableItem } from '@/components/draggable-item.comp';
import { InsertionPlaceholder } from '@/components/insertion-placeholder.comp';
import clsx from 'clsx';
import { useEffect, useRef, useState, type DragEvent, type FC } from 'react';

interface DraggedItem {
  id: string;
  content: string;
}

interface DragState {
  isDragging: boolean;
  draggedItem: DraggedItem | null;
  position: DraggedItemPosition;
}

interface DragDropContainerProps {
  items: DraggedItem[];
}

export const DraDropContainer: FC<DragDropContainerProps> = ({ items }) => {
  const [listItems, setListItems] = useState<DraggedItem[]>(items);
  const [overBoundary, setOverBoundary] = useState<number | null>(null);

  // Keep 'dragging'-state isolated from the re-ordering math
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    position: { x: 0, y: 0 },
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [originalIndex, setOriginalIndex] = useState<number | null>(null);
  const cleanupRef = useRef(false);

  console.debug({ draggingId, originalIndex, overBoundary });

  const handleDragStart = (itemId: string, position: { x: number; y: number }) => {
    const draggedItem = listItems.find((item) => item.id === itemId) ?? null;
    const index = listItems.findIndex((idx) => idx.id === itemId);

    // Reserve the original slot immediately so the list doesn't jump and we keep a consistent placeholder.
    setOverBoundary(index); // start with placeholder at original position
    setDraggingId(itemId);
    setOriginalIndex(index);

    setDragState({
      isDragging: true,
      draggedItem,
      position,
    });
  };

  const handleDragMove = (position: DraggedItemPosition) => {
    setDragState((prev) => ({
      ...prev,
      position,
    }));
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, hoverId: string) => {
    if (!draggingId) return;
    event.preventDefault();

    const hoverIndex = listItems.findIndex((idx) => idx.id === hoverId);

    if (hoverIndex === -1) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const boundary = offsetY < rect.height / 2 ? hoverIndex : hoverIndex + 1;

    if (overBoundary !== boundary) {
      setOverBoundary(boundary);
    }
  };

  const handleDragEnd = () => {
    if (cleanupRef.current) return; // guard: already cleaned
    if (draggingId && originalIndex !== null && overBoundary !== null) {
      const target = computeTargetFromBoundary(originalIndex, overBoundary);

      if (target !== originalIndex) {
        setListItems((prev) => reorder(prev, originalIndex, target));
      }
    }

    cleanUpDrag();
  };

  const cleanUpDrag = (options?: { cancelled?: boolean }) => {
    cleanupRef.current = true;
    setDragState({
      isDragging: false,
      draggedItem: null,
      position: { x: 0, y: 0 },
    });

    setDraggingId(null);
    setOriginalIndex(null);
    setOverBoundary(null);

    if (options?.cancelled) {
      console.debug('Drag Cancelled');
    }
  };

  // Global safety net to ensure cleanup even if native dragend is skipped (edge cases when DOM mutates)
  useEffect(() => {
    if (!dragState.isDragging) return;
    cleanupRef.current = false;

    const handleGlobalEnd = () => {
      if (!cleanupRef.current) {
        cleanUpDrag();
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!cleanupRef.current) {
          cleanUpDrag({ cancelled: true });
        }
      }
    };

    window.addEventListener('dragend', handleGlobalEnd, true);
    window.addEventListener('drop', handleGlobalEnd, true);
    window.addEventListener('keydown', handleKey, true);
    return () => {
      window.removeEventListener('dragend', handleGlobalEnd, true);
      window.removeEventListener('drop', handleGlobalEnd, true);
      window.removeEventListener('keydown', handleKey, true);
    };
  }, [dragState.isDragging]);

  return (
    <>
      <div
        className={clsx(
          'flex',
          'flex-col',
          'gap-3',
          'rounded',
          'bg-gray-900',
          'outline-2',
          'outline-gray-800',
          'outline-offset-3',
          'p-4',
        )}
      >
        {listItems.map((item, index) => {
          const isSource = draggingId === item.id;
          return (
            <div key={item.id} className={clsx('flex flex-col relative')}>
              {overBoundary === index && <InsertionPlaceholder />}
              <DraggableItem
                id={item.id}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onDragOver={(event) => handleDragOver(event, item.id)}
                className={clsx(
                  isSource && [
                    // Hide via opacity (safer than visibility hidden for maintaining drag events)
                    'opacity-0',
                    'pointer-events-none',
                  ],
                )}
                aria-hidden={isSource || undefined}
              >
                {item.content}
              </DraggableItem>
            </div>
          );
        })}
        {overBoundary === listItems.length && <InsertionPlaceholder />}
      </div>
      {/* Custom Drag Preview */}
      <DraggableItemPreview isDragging={dragState.isDragging} position={dragState.position}>
        {dragState.draggedItem?.content}
      </DraggableItemPreview>
    </>
  );
};
