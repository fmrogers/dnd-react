import clsx from 'clsx';
import type { FC } from 'react';

interface InsertionPlaceholderProps {
  className?: string;
  isDragging?: boolean;
}

export const InsertionPlaceholder: FC<InsertionPlaceholderProps> = ({ className, isDragging }) => {
  return (
    <div
      className={clsx(
        'h-14',
        'rounded',
        !isDragging && 'mb-3',
        'border-2',
        'border-dashed',
        'border-orange-400/80',
        'bg-orange-400/10',
        'animate-pulse',
        className,
      )}
      aria-hidden="true"
    />
  );
};
