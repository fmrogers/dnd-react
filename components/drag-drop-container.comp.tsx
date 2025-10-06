"use client";

import type { DraggedItemPosition } from "@/components/component.types";
import { DraggableItemPreview } from "@/components/draggable-item-preview.comp";
import { DraggableItem } from "@/components/draggable-item.comp";
import { DropZone } from "@/components/drop-zone.comp";
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

  // Debug logging
  console.log("DragDropContainer render - dragState:", dragState);

  const handleDragStart = (
    itemId: string,
    position: { x: number; y: number }
  ) => {
    console.log("🚀 handleDragStart called:", { itemId, position });
    const draggedItem = items.find((item) => item.id === itemId) ?? null;
    console.log("Found draggedItem:", draggedItem);

    setDragState({
      isDragging: true,
      draggedItem,
      position,
    });
    console.log("Updated dragState to isDragging: true");
  };

  const handleDragMove = (position: DraggedItemPosition) => {
    console.log("📍 handleDragMove called:", position);
    setDragState((previousState) => ({
      ...previousState,
      position,
    }));
  };

  const handleDragEnd = () => {
    console.log("🏁 handleDragEnd called");
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
    <div className="flex gap-8 p-8">
      <div className="flex flex-col gap-4">
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
      {/* Drop Zones */}
      <div className="flex flex-col gap-4">
        <DropZone onDrop={handleDrop}>
          <p>Drop Zone 1</p>
        </DropZone>
        <DropZone onDrop={handleDrop}>
          <p>Drop Zone 2</p>
        </DropZone>
      </div>

      {/* Custom Drag Preview */}
      <DraggableItemPreview
        isDragging={dragState.isDragging}
        position={dragState.position}
      >
        {dragState.draggedItem?.content}
      </DraggableItemPreview>
    </div>
  );
};
