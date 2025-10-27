'use client';
import clsx from 'clsx';
import type { FC, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Item } from './types';

interface DragOverlayProps {
  item?: Item;
  ref3: RefObject<HTMLDivElement | null>;
}

export const DragOverlay4: FC<DragOverlayProps> = ({ item, ref3 }) => {
  const rect = {
    top: 0,
    left: 0,
    width: 200,
    height: 40,
  };

  const delta = {
    y: 0,
    x: 0,
  };

  return (
    <div
      className={clsx(
        'px-3',
        'py-2',
        'rounded',
        'border-2',
        'border-slate-500',
        'bg-slate-700',
        'flex',
        'items-center',
        'gap-3',
        'h-[var(--cpl-dnd-sort-list-item-height)]',
      )}
      draggable
    >
      <div className="flex p-1 gap-3">
        <div className="flex-1 min-w-0">{item?.content}</div>
      </div>
    </div>
  );

  return createPortal(
    // <div
    //   ref={ref3}
    //   className={clsx(
    //     // 'fixed',
    //     // 'z-[9999]',
    //     // 'pointer-events-none',
    //     'rounded',
    //     'border-2',
    //     'border-orange-300',
    //     'bg-orange-400',
    //     'text-neutral-900',
    //     'px-3',
    //     'py-2',
    //     'flex',
    //     'items-center',
    //     'shadow-lg',
    //     !item && 'hidden',
    //   )}
    //   // style={{
    //   // top: rect.top + delta.y,
    //   // left: rect.left + delta.x,
    //   // width: rect.width,
    //   // height: rect.height,
    //   // transform: 'translate3d(0,0,0)',
    //   // }}
    // >
    <div
      className={clsx(
        'px-3',
        'py-2',
        'rounded',
        'border-2',
        'border-slate-500',
        'bg-slate-700',
        'flex',
        'items-center',
        'gap-3',
      )}
    >
      <div className="flex p-1 gap-3">
        <div className="flex-1 min-w-0">{item?.content}</div>
      </div>
    </div>,
    document.body,
  );
};
