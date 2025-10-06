"use client";

import type { DraggedItemPosition } from "@/components/component.types";
import { DraggableItemPreview } from "@/components/draggable-item-preview.comp";
import { DraggableItem } from "@/components/draggable-item.comp";
import clsx from "clsx";
import { useState, type FC } from "react";

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
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    position: { x: 0, y: 0 },
  });

  const handleDragStart = (
    itemId: string,
    position: { x: number; y: number }
  ) => {
    const draggedItem = items.find((item) => item.id === itemId) ?? null;

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

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      position: { x: 0, y: 0 },
    });
  };

  const handleDrop = (draggedId: string) => {
    console.log("Dropped item: ", draggedId);
  };

  return (
    <>
      <div
        className={clsx(
          "flex",
          "flex-col",
          "gap-4",
          "rounded",
          "bg-gray-900",
          "outline-2",
          "outline-gray-800",
          "outline-offset-3",
          "p-4"
        )}
      >
        {items.map((item) => (
          <DraggableItem
            key={item.id}
            id={item.id}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            {item.content}
          </DraggableItem>
        ))}
      </div>
      {/* Custom Drag Preview */}
      <DraggableItemPreview
        isDragging={dragState.isDragging}
        position={dragState.position}
      >
        {dragState.draggedItem?.content}
      </DraggableItemPreview>
    </>
  );
};
