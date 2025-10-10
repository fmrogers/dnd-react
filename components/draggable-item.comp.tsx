'use client';

import type { DraggedItemPosition } from '@/components/dnd.types';
import { DraggableHandle } from '@/components/draggable-handle.comp';
import clsx from 'clsx';
import { useEffect, useRef, useState, type DragEvent, type FC, type ReactNode } from 'react';

interface DraggableItemProps {
  id: string;
  children: ReactNode;
  onDragStart?: (id: string, position: DraggedItemPosition) => void;
  onDragMove?: (position: DraggedItemPosition) => void;
  onDragEnd?: () => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  showHandle?: boolean;
  className?: string;
}

export const DraggableItem: FC<DraggableItemProps> = ({
  id,
  children,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragOver,
  showHandle = true,
  className,
}) => {
  const [isBeingDragged, setIsBeingDragged] = useState<boolean>(false);
  const [isDragEnabled, setIsDragEnabled] = useState<boolean>(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    if (!isDragEnabled) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';

    const emptyImage = new Image();
    emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    event.dataTransfer.setDragImage(emptyImage, 0, 0);
  };

  const handleDragViaHandle = (event: React.MouseEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    setIsDragEnabled(true);
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
    setIsDragEnabled(false);
    onDragEnd?.();
  };

  const handleMouseUp = () => {
    if (isBeingDragged) {
      setIsBeingDragged(false);
      onDragEnd?.();
    }
    setIsDragEnabled(false);
  };

  useEffect(() => {
    if (!isBeingDragged && isDragEnabled) {
      setIsDragEnabled(false);
    }
  }, [isBeingDragged, isDragEnabled]);

  return (
    <div
      ref={rootRef}
      draggable={isDragEnabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrag={handleDrag}
      onDragOver={onDragOver}
      onMouseUp={handleMouseUp}
      className={clsx(
        'w-120',
        'px-3',
        'py-2',
        'bg-slate-700',
        'border-slate-600',
        'border-2',
        'rounded',
        'flex',
        'items-center',
        'gap-3',
        { 'opacity-30': isBeingDragged },
        className,
      )}
    >
      {showHandle && (
        <button
          type="button"
          onMouseDown={handleDragViaHandle}
          className={clsx(
            'group',
            'p-1',
            'cursor-grab',
            'active:cursor-grabbing',
            'rounded',
            'hover:bg-slate-500',
            'focus:outline-none focus:ring focus:ring-slate-500/50',
          )}
          aria-label="Drag item"
        >
          <DraggableHandle
            size={20}
            className="text-slate-400 group-hover:text-slate-200"
            pathClassName="fill-slate-400 group-hover:fill-slate-200"
          />
        </button>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};
