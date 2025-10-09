'use client';

import type { DraggedItemPosition } from '@/components/dnd.types';
import { computeTargetFromBoundary, reorder } from '@/components/dnd.utils';
import { DraggableItemPreview } from '@/components/draggable-item-preview.comp';
import { DraggableItem } from '@/components/draggable-item.comp';
import clsx from 'clsx';
import { useState, type DragEvent, type FC } from 'react';

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

  console.debug({ draggingId, originalIndex, overBoundary });

  const handleDragStart = (itemId: string, position: { x: number; y: number }) => {
    const draggedItem = listItems.find((item) => item.id === itemId) ?? null;
    const index = listItems.findIndex((idx) => idx.id === itemId);

    setDraggingId(itemId);
    setOriginalIndex(index);

    setDragState({
      isDragging: true,
      draggedItem,
      position,
    });
  };

  const handleDragMove = (position: DraggedItemPosition) => {
    setDragState((previousState) => ({
      ...previousState,
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
    if (draggingId && originalIndex !== null && overBoundary !== null) {
      const target = computeTargetFromBoundary(originalIndex, overBoundary);

      if (target !== originalIndex) {
        setListItems((previousState) => reorder(previousState, originalIndex, target));
      }
    }

    cleanUpDrag();
  };

  const cleanUpDrag = (options?: { cancelled?: boolean }) => {
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

  return (
    <>
      <div
        className={clsx(
          'flex',
          'flex-col',
          'gap-4',
          'rounded',
          'bg-gray-900',
          'outline-2',
          'outline-gray-800',
          'outline-offset-3',
          'p-4',
        )}
      >
        {listItems.map((item, index) => {
          return (
            <div key={item.id} className="relative">
              {overBoundary === index && (
                <div className="absolute -top-2 left-0 right-0 h-0.5 bg-orange-400 shadow-[0_0_4px_rgba(249,115,22,0.6)]" />
              )}
              <DraggableItem
                id={item.id}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onDragOver={(event) => handleDragOver(event, item.id)}
              >
                {item.content}
              </DraggableItem>
              {index === listItems.length - 1 && overBoundary === listItems.length && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-400 shadow-[0_0_4px_rgba(249,115,22,0.6)]" />
              )}
            </div>
          );
        })}
      </div>
      {/* Custom Drag Preview */}
      <DraggableItemPreview isDragging={dragState.isDragging} position={dragState.position}>
        {dragState.draggedItem?.content}
      </DraggableItemPreview>
    </>
  );
};
