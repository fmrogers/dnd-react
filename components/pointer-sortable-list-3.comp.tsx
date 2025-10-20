'use client';

import { DraggableHandle } from '@/components/draggable-handle.comp';
import clsx from 'clsx';
import { DragEvent, Fragment, useCallback, useEffect, useState, type FC } from 'react';
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

  const handleItemDrop = useCallback((draggedItemId: string, targetItemId: string) => {
    // Reorder items
    setItems((prevItems) => {
      const draggedIndex = prevItems.findIndex((item) => item.id === draggedItemId);
      const targetIndex = prevItems.findIndex((item) => item.id === targetItemId);

      if (draggedIndex === -1 || targetIndex === -1) {
        return prevItems;
      }

      const updatedItems = [...prevItems];
      const [draggedItem] = updatedItems.splice(draggedIndex, 1);
      console.log(draggedItem);
      updatedItems.splice(targetIndex, 0, draggedItem);

      console.log(updatedItems);

      return updatedItems;
    });
  }, []);

  return (
    <div className="p-4 rounded bg-gray-900" /*  onDragStart={suppressNativeDrag} */>
      <div className="sortable-list flex flex-col">
        {items.map((item) => (
          <DraggableListItem key={item.id} item={item} onItemDrop={handleItemDrop} />
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

function DraggableListItem({
  item,
  onItemDrop,
}: {
  item: Item;
  onItemDrop: (draggedItemId: string, targetItemId: string) => void;
}) {
  const [shouldBeDraggable, setShouldBeDraggable] = useState(false);

  const handleDragHandleMouseOver = () => {
    setShouldBeDraggable(true);
  };

  const handleDragHandleMouseOut = () => {
    setShouldBeDraggable(false);
  };

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!shouldBeDraggable && isDragging) {
      setIsDragging(false);
    }
  }, [shouldBeDraggable]);

  return (
    <Fragment key={item.id}>
      <div
        key={item.id}
        className={clsx(
          item.id,
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
              onDragStart: (event) => {
                setIsDragging(true);
                event.dataTransfer.setData(ITEM_ID_DATA_TRANSFER_KEY, item.id);
              },
              onDragEnd: (event) => {
                setIsDragging(false);
                event.dataTransfer.clearData();
              },
            }
          : {
              onDragOver: (event) => {
                // This enables dropping
                event.preventDefault();
              },
              onDragEnterCapture: (event: DragEvent<HTMLDivElement>) => {
                getDroppableListItem(event)?.classList.add(CPL_DRAGGING_OVER_LIST_ITEM_CLASS_NAME);
              },
              onDragLeave: (event: DragEvent<HTMLDivElement>) => {
                const targetIsListItem = (event.target as HTMLDivElement).classList.contains(CPL_DRAG_ITEM_CLASS_NAME);

                if (targetIsListItem) {
                  (event.target as HTMLDivElement).classList.remove(CPL_DRAGGING_OVER_LIST_ITEM_CLASS_NAME);
                }
              },
              onDrop: (event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();

                const droppableListItem = getDroppableListItem(event);

                if (!droppableListItem) {
                  return;
                }

                droppableListItem.classList.remove(CPL_DRAGGING_OVER_LIST_ITEM_CLASS_NAME);

                const originalItemId = event.dataTransfer.getData(ITEM_ID_DATA_TRANSFER_KEY);

                if (!originalItemId) {
                  return;
                }

                onItemDrop(originalItemId, item.id);

                event.dataTransfer.clearData();
              },
            })}
      >
        <button
          className={clsx(
            item.id,
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
const ITEM_ID_DATA_TRANSFER_KEY = 'text';
