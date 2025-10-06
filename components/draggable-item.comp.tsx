'use client';

import type { DraggedItemPosition } from '@/components/dnd.types';
import clsx from 'clsx';
import { useState, type DragEvent, type FC, type ReactNode } from 'react';

interface DraggableItemProps {
  id: string;
  children: ReactNode;
  onDragStart?: (id: string, position: DraggedItemPosition) => void;
  onDragMove?: (position: DraggedItemPosition) => void;
  onDragEnd?: () => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
}

export const DraggableItem: FC<DraggableItemProps> = ({
  id,
  children,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragOver,
}) => {
  const [isBeingDragged, setIsBeingDragged] = useState<boolean>(false);

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';

    // Hide browser drag image
    const emptyImage = new Image();
    emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    event.dataTransfer.setDragImage(emptyImage, 0, 0);

    // Don't call onDragStart here since handleMouseDown already did
    // Just ensure the drag state is set
    setIsBeingDragged(true);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    // Trigger preview immediately on mouse down
    onDragStart?.(id, { x: event.clientX, y: event.clientY });
    setIsBeingDragged(true);
  };

  const handleDrag = (event: DragEvent<HTMLDivElement>) => {
    if (event.clientX !== 0 && event.clientY !== 0) {
      onDragMove?.({ x: event.clientX, y: event.clientY });
    }
  };

  const handleDragEnd = (event: DragEvent<HTMLDivElement>) => {
    setIsBeingDragged(false);
    onDragEnd?.();
  };

  // Also handle mouse up to clean up state if drag doesn't complete properly
  const handleMouseUp = () => {
    if (isBeingDragged) {
      setIsBeingDragged(false);
      onDragEnd?.();
    }
  };

  return (
    <div
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrag={handleDrag}
      onDragOver={onDragOver}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={clsx(
        'w-120',
        'cursor-grab',
        'px-4',
        'py-2',
        'bg-slate-700',
        'border-slate-600',
        'border-2',
        'rounded',
      )}
    >
      {children}
    </div>
  );
};
