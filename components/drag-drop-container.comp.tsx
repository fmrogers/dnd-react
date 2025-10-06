'use client';

import type { DraggedItemPosition, DragOverState, DragPosition } from '@/components/dnd.types';
import { computeTargetIndex, reorder } from '@/components/dnd.utils';
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

  // Keep 'dragging'-state isolated from the re-ordering math
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    position: { x: 0, y: 0 },
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [originalIndex, setOriginalIndex] = useState<number | null>(null);
  const [over, setOver] = useState<DragOverState | null>(null);

  console.debug({ draggingId, originalIndex, over });
  //console.log(over);

  const handleDragStart = (itemId: string, position: { x: number; y: number }) => {
    const draggedItem = listItems.find((item) => item.id === itemId) ?? null;
    const index = listItems.findIndex((idx) => idx.id === itemId);

    cleanUpDrag();
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
    const position: DragPosition = offsetY < rect.height / 2 ? 'before' : 'after';

    if (over && over.index === hoverIndex && over.position === position) return;

    setOver({ index: hoverIndex, position });
  };

  const handleDragEnd = () => {
    if (draggingId !== null && originalIndex !== null && over !== null) {
      const targetIndex = computeTargetIndex(originalIndex, over, listItems.length);

      if (targetIndex !== originalIndex) {
        setListItems((previousState) => reorder(previousState, originalIndex, targetIndex));
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
    setOver(null);

    if (options?.cancelled) {
      console.debug('Drag Cancelled');
    }
  };

  const renderInsertionLine = (itemIndex: number) => {
    if (!over) return null;
    if (over.index !== itemIndex) return null;

    const isBefore = over.position === 'before';

    return (
      <div
        className={clsx(
          'pointer-events-none',
          'absolute',
          'left-0',
          'right-0',
          'h-0.5',
          'bg-orange-400',
          isBefore ? 'top-0' : 'bottom-0',
          'shadow-[0_0_4px_rgba(249,115,22,0.6)]',
          'transition-opacity',
        )}
      />
    );
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
        {listItems.map((item, index) => (
          <div key={item.id} className="relative">
            {renderInsertionLine(index)}
            <DraggableItem
              key={item.id}
              id={item.id}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragOver={(event) => handleDragOver(event, item.id)}
              onDragEnd={handleDragEnd}
            >
              {item.content}
            </DraggableItem>
          </div>
        ))}
      </div>
      {/* Custom Drag Preview */}
      <DraggableItemPreview isDragging={dragState.isDragging} position={dragState.position}>
        {dragState.draggedItem?.content}
      </DraggableItemPreview>
    </>
  );
};
