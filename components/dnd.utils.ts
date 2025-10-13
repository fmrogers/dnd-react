export const reorder = <T>(list: T[], from: number, to: number): T[] => {
  if (from === to) return list;

  const copy = [...list];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);

  return copy;
};

export const computeTargetFromBoundary = (originalIndex: number, boundary: number): number => {
  if (boundary <= originalIndex) {
    return boundary;
  } else {
    return boundary - 1;
  }
};
