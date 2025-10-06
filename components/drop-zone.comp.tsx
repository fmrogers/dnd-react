"use client";

import { clsx } from "clsx";
import { useState, type DragEvent, type FC, type ReactNode } from "react";

interface DropZoneProps {
  onDrop: (draggedId: string) => void;
  children: ReactNode;
}

export const DropZone: FC<DropZoneProps> = ({ onDrop, children }) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const draggedId = event.dataTransfer.getData("text/plain");
    onDrop(draggedId);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={` ${clsx(
        "flex flex-col justify-center items-center p-2",
        "rounded-xl bg-gray-800 outline-2 outline-gray-600 outline-offset-3 min-h-50 w-100",
        { "outline-blue-400": isDragOver }
      )}`}
    >
      {children}
    </div>
  );
};
