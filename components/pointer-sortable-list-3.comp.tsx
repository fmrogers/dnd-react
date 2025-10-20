'use client';

import { DraggableHandle } from '@/components/draggable-handle.comp';
import clsx from 'clsx';
import { DragEvent, Fragment, useCallback, useRef, useState, type FC } from 'react';
import styles from './pointer-sortable-list.module.css';

interface Item {
  id: string;
  content: string;
}

interface PointerSortableListProps {
  initial: Item[];
}

export const PointerSortableList3: FC<PointerSortableListProps> = ({ initial }) => {
  const [items, setItems] = useState<Item[]>(initial);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  const registerRef = useCallback((id: string, element: HTMLElement | null) => {
    refs.current[id] = element;
  }, []);

  // Build a flat array of children (placeholders and items) as direct siblings
  // const children: React.ReactNode[] = [];
  // items.forEach((item, index) => {
  //   const isSource = drag.isDragging && drag.id === item.id;
  //   const boundaryBefore = drag.isDragging && drag.overBoundary === index;

  //   if (boundaryBefore) {
  //     children.push(<InsertionPlaceholder key={`ph-${index}`} isDragging={drag.isDragging} />);
  //   }

  //   if (!isSource) {
  //     children.push(
  //       <div
  //         key={item.id}
  //         ref={(element) => registerRef(item.id, element)}
  //         className={clsx(
  //           'w-120',
  //           'px-3',
  //           'py-2',
  //           'rounded',
  //           'border-2',
  //           'border-slate-500',
  //           'bg-slate-700',
  //           'flex',
  //           'items-center',
  //           'gap-3',
  //         )}
  //       >
  //         <button
  //           type="button"
  //           onPointerDown={(event) => handlePointerDown(event, item.id)}
  //           className={clsx(
  //             'p-1',
  //             'cursor-grab',
  //             'active:cursor-grabbing',
  //             'rounded',
  //             'hover:bg-slate-500',
  //             'focus:outline-none',
  //             'focus:ring',
  //             'focus:ring-slate-500/50',
  //             'select-none',
  //           )}
  //           aria-label="Drag handle"
  //         >
  //           <DraggableHandle />
  //         </button>
  //         <div className={clsx('flex-1', 'min-w-0')}>{item.content}</div>
  //       </div>,
  //     );
  //   }
  // });
  // if (drag.isDragging && drag.overBoundary === items.length) {
  //   children.push(<InsertionPlaceholder key={`ph-end`} isDragging={drag.isDragging} />);
  // }

  return (
    <div className="p-4 rounded bg-gray-900" /*  onDragStart={suppressNativeDrag} */>
      <div className="sortable-list flex flex-col">
        {items.map((item, index) => (
          <DraggableListItem key={item.id} item={item} />
        ))}
      </div>
      {/* <DragOverlay drag={drag} renderContent={(id) => items.find((item) => item.id === id)?.content} /> */}
    </div>
  );
};

// Prevent any accidental native dragstart bubbling from text nodes or images
const suppressNativeDrag = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

function DraggableListItem({ item }: { item: Item }) {
  const [shouldBeDraggable, setShouldBeDraggable] = useState(false);

  const handleDragHandleMouseOver = () => {
    setShouldBeDraggable(true);
  };

  const handleDragHandleMouseOut = () => {
    setShouldBeDraggable(false);
  };

  const [isDragging, setIsDragging] = useState(false);

  return (
    <Fragment key={item.id}>
      <div
        key={item.id}
        className={clsx(
          'w-120',
          'px-3',
          'py-2',
          'rounded',
          'border-2',
          'border-slate-500',
          'bg-slate-700',
          'flex',
          'items-center',
          'gap-3',
          CPL_DRAG_ITEM_CLASS_NAME,
          isDragging && 'opacity-50',
        )}
        {...(shouldBeDraggable
          ? {
              draggable: true,
              onDragStart: () => {
                setIsDragging(true);
              },
              onDragEnd: () => {
                setIsDragging(false);
              },
            }
          : {
              onDragOver: (event) => {
                event.preventDefault();

                // console.log(event);
              },
              onDragEnterCapture: (event: DragEvent<HTMLDivElement>) => {
                const droppableListItem = getDroppableListItem(event);

                if (droppableListItem) {
                  droppableListItem.classList.add(CPL_DRAGGING_OVER_LIST_ITEM_CLASS_NAME);
                }
              },
              onDragLeave: (event: DragEvent<HTMLDivElement>) => {
                const targetIsListItem = (event.target as HTMLDivElement).classList.contains(CPL_DRAG_ITEM_CLASS_NAME);

                console.log({ event, targetIsListItem });

                if (!targetIsListItem) {
                  (event.target as HTMLDivElement).classList.remove(CPL_DRAGGING_OVER_LIST_ITEM_CLASS_NAME);
                }
              },
              onDrop: (event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();

                setShouldBeDraggable(false);

                const droppableListItem = getDroppableListItem(event);

                if (droppableListItem) {
                  droppableListItem.classList.remove(CPL_DRAGGING_OVER_LIST_ITEM_CLASS_NAME);
                  // Reset mouse events again to allow events on children
                  // droppableListItem.style.pointerEvents = 'all';
                }
              },
            })}
      >
        <button
          type="button"
          // onPointerDown={(event) => handlePointerDown(event, item.id)}
          className={clsx(
            'p-1',
            'cursor-grab',
            'active:cursor-grabbing',
            'rounded',
            'hover:bg-slate-500',
            'focus:outline-none',
            'focus:ring',
            'focus:ring-slate-500/50',
            'select-none',
          )}
          aria-label="Drag handle"
          onMouseDown={handleDragHandleMouseOver}
          onMouseOut={handleDragHandleMouseOut}
        >
          <DraggableHandle />
        </button>
        <div className={clsx('flex-1', 'min-w-0')}>{item.content}</div>
      </div>
      {/* <div className={styles.divider} /> */}
    </Fragment>
  );
}

function getDroppableListItem(event: DragEvent<HTMLDivElement>) {
  console.log(event.target);

  return (event.target as HTMLElement).closest(`.${CPL_DRAG_ITEM_CLASS_NAME}`) as HTMLDivElement | null;
}

const CPL_DRAG_ITEM_CLASS_NAME = 'cpl-dragitem';
const CPL_DRAGGING_OVER_LIST_ITEM_CLASS_NAME = styles.draggingOverListItem;
