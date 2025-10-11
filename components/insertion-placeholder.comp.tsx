import clsx from 'clsx';
import type { FC } from 'react';

interface InsertionPlaceholderProps {
  className?: string;
}

export const InsertionPlaceholder: FC<InsertionPlaceholderProps> = ({ className }) => {
  return (
    <div
      className={clsx(
        'h-12',
        'rounded',
        'mb-3',
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
