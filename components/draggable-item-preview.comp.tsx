"use client";

import clsx from "clsx";
import type { FC, ReactNode } from "react";
import { createPortal } from "react-dom";

interface DraggableItemPreviewProps {
  isDragging: boolean;
  position: {
    x: number;
    y: number;
  };
  children: ReactNode;
}

export const DraggableItemPreview: FC<DraggableItemPreviewProps> = ({
  isDragging,
  position,
  children,
}) => {
  if (!isDragging) return null;

  return createPortal(
    <div
      className={clsx(
        "fixed",
        "z-[9999]",
        "w-120",
        "cursor-grabbing",
        "pointer-events-none",
        "px-4",
        "py-2",
        "rounded",
        "bg-orange-400",
        "border-orange-300",
        "text-neutral-900"
      )}
      style={{
        left: position.x - 50,
        top: position.y - 25,
      }}
    >
      {children}
    </div>,
    document.body
  );
};
