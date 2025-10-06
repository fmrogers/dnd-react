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
  // Debug logging
  console.log("DraggableItemPreview:", { isDragging, position, children });
  console.log("Preview positioning:", {
    left: position.x - 50,
    top: position.y - 25,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  });

  if (!isDragging) return null;

  return createPortal(
    <div
      className={clsx(
        "fixed",
        "z-[9999]",
        "min-w-[100px]",
        "min-h-[50px]",
        "pointer-events-none",
        "scale-110",
        "bg-red-500",
        "border-4",
        "border-yellow-400",
        "p-4",
        "rounded-lg",
        "shadow-2xl",
        "opacity-100",
        "text-white",
        "text-base",
        "bold"
      )}
      style={{
        left: position.x - 50,
        top: position.y - 25,
      }}
    >
      <div style={{ background: "blue", padding: "8px", borderRadius: "4px" }}>
        DRAG PREVIEW: {children}
      </div>
    </div>,
    document.body
  );
};
