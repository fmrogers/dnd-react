export interface DraggedItemPosition {
  x: number;
  y: number;
}

export type DragPosition = 'before' | 'after';

export interface DragOverState {
  index: number;
  position: DragPosition;
}

// Pointer solution types

export type PointerDragState =
  | { isDragging: false }
  | {
      isDragging: true;
      id: string;
      originalIndex: number;
      origin: { x: number; y: number };
      delta: { x: number; y: number };
      rect: DOMRect;
      overBoundary: number;
    };
