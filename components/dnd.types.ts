export interface DraggedItemPosition {
  x: number;
  y: number;
}

export type DragPosition = 'before' | 'after';

export interface DragOverState {
  index: number;
  position: DragPosition;
}
