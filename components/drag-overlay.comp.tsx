'use client';
import type { PointerDragState } from '@/components/dnd.types';
import clsx from 'clsx';
import type { FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface DragOverlayProps {
  drag: PointerDragState;
  renderContent: (id: string) => ReactNode;
}

export const DragOverlay: FC<DragOverlayProps> = ({ drag, renderContent }) => {
  if (!drag.isDragging) return null;

  const { rect, delta, id } = drag;

  return createPortal(
    <div
      className={clsx(
        'fixed',
        'z-[9999]',
        'pointer-events-none',
        'rounded',
        'border-2',
        'border-orange-300',
        'bg-orange-400',
        'text-neutral-900',
        'px-3',
        'py-2',
        'shadow-lg',
      )}
      style={{
        top: rect.top + delta.y,
        left: rect.left + delta.x,
        width: rect.width,
        height: rect.height,
        transform: 'translate3d(0,0,0)',
      }}
    >
      {renderContent(id)}
    </div>,
    document.body,
  );
};
