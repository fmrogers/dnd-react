import type { DragOverState } from '@/components/dnd.types';

export const reorder = <T>(list: T[], from: number, to: number): T[] => {
  if (from === to) return list;

  const copy = [...list];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);

  return copy;
};

export const computeTargetIndex = (originalIndex: number, over: DragOverState, length: number): number => {
  const { index: hoverIndex, position } = over;

  let target =
    position === 'before'
      ? hoverIndex > originalIndex
        ? hoverIndex - 1
        : hoverIndex
      : hoverIndex > originalIndex
      ? hoverIndex
      : hoverIndex + 1;

  if (target < 0) {
    target = 0;
  }

  if (target > length - 1) {
    target = length - 1;
  }

  return target;
};

export const computeTargetFromBoundary = (originalIndex: number, boundary: number): number => {
  if (boundary <= originalIndex) {
    return boundary;
  } else {
    return boundary - 1;
  }
};
