"use client";

import type { DraggedItemPosition } from "@/components/component.types";
import clsx from "clsx";
import { useState, type DragEvent, type FC, type ReactNode } from "react";

interface DraggableItemProps {
  id: string;
  children: ReactNode;
  onDragStart?: (id: string, position: DraggedItemPosition) => void;
  onDragMove?: (position: DraggedItemPosition) => void;
  onDragEnd?: () => void;
}

export const DraggableItem: FC<DraggableItemProps> = ({
  id,
  children,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const [isBeingDragged, setIsBeingDragged] = useState<boolean>(false);

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    console.log("🎯 DraggableItem handleDragStart:", {
      id,
      clientX: event.clientX,
      clientY: event.clientY,
    });

    event.dataTransfer.setData("text/plain", id);
    event.dataTransfer.effectAllowed = "move";

    // Hide browser drag image
    const emptyImage = new Image();
    emptyImage.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
    event.dataTransfer.setDragImage(emptyImage, 0, 0);

    // Don't call onDragStart here since handleMouseDown already did
    // Just ensure the drag state is set
    setIsBeingDragged(true);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    console.log("🖱️ Mouse down on draggable item");
    // Trigger preview immediately on mouse down
    onDragStart?.(id, { x: event.clientX, y: event.clientY });
    setIsBeingDragged(true);
  };

  const handleDrag = (event: DragEvent<HTMLDivElement>) => {
    console.log("🏃 DraggableItem handleDrag:", {
      clientX: event.clientX,
      clientY: event.clientY,
    });
    if (event.clientX !== 0 && event.clientY !== 0) {
      onDragMove?.({ x: event.clientX, y: event.clientY });
    }
  };

  const handleDragEnd = (event: DragEvent<HTMLDivElement>) => {
    console.log("🏁 DraggableItem handleDragEnd");
    setIsBeingDragged(false);
    onDragEnd?.();
  };

  // Also handle mouse up to clean up state if drag doesn't complete properly
  const handleMouseUp = () => {
    console.log("🖱️ Mouse up - cleaning up if needed");
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
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={clsx(
        "w-full cursor-grab p-2 m-1",
        { "bg-slate-700 border-slate-600": !isBeingDragged },
        { "bg-orange-400 border-orange-300 text-neutral-900": isBeingDragged },
        "border-2 rounded-xl",
        "active:opacity-1"
      )}
    >
      {children}
    </div>
  );
};
