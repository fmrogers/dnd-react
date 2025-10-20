'use client';

import { flattenTree, FlattenTreeNode } from '@/app/utilities/flatten-tree-2';
import clsx from 'clsx';
import React, { DragEvent, Fragment, ReactNode, useCallback, useMemo, useState, type FC } from 'react';
import styles from './pointer-sortable-list.module.css';

interface Item {
  id: string;
  content: string;
  children?: Item[];
}

interface PointerSortableListProps {
  initial: Item[];
}

export const PointerSortableList4: FC<PointerSortableListProps> = ({ initial }) => {
  const itemsIdMap = useMemo(() => {
    const map = new Map<string, Item>();

    initial.forEach((item) => map.set(item.id, item));

    return map;
  }, []);

  const [items, setItems] = useState<Item[]>(initial);

  const flatItems = useMemo(() => {
    return flattenTree(items, 'id');
  }, [items]);

  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const handleItemDrop = useCallback((itemDropEvent: HandleItemDropEvent) => {
    const { kind } = itemDropEvent;

    switch (kind) {
      case 'below': {
        const { draggedItemId, targetItemId } = itemDropEvent;

        setItems((prevItems) => {
          // Find the dragged item and its parent context
          let draggedItem: Item | null = null;
          let draggedParentArray: Item[] | null = null;
          let draggedIndex = -1;

          // Find the target item and its parent context  
          let targetParentArray: Item[] | null = null;
          let targetIndex = -1;

          function findItemRecursively(items: Item[], parentArray: Item[] | null = null): void {
            items.forEach((item, index) => {
              if (item.id === draggedItemId) {
                draggedItem = item;
                draggedParentArray = parentArray || prevItems;
                draggedIndex = parentArray ? parentArray.findIndex(p => p.id === item.id) : index;
              }
              if (item.id === targetItemId) {
                targetParentArray = parentArray || prevItems;
                targetIndex = parentArray ? parentArray.findIndex(p => p.id === item.id) : index;
              }
              if (item.children) {
                findItemRecursively(item.children, items);
              }
            });
          }

          findItemRecursively(prevItems);

          if (!draggedItem || !draggedParentArray || !targetParentArray || draggedIndex === -1 || targetIndex === -1) {
            return prevItems;
          }

          // If moving within the same parent array
          if (draggedParentArray === targetParentArray) {
            const updatedItems = JSON.parse(JSON.stringify(prevItems)); // Deep clone
            
            function reorderWithinSameParent(items: Item[]): Item[] {
              return items.map(item => {
                if (item.children && item.children === draggedParentArray) {
                  const newChildren = [...item.children];
                  const [movedItem] = newChildren.splice(draggedIndex, 1);
                  newChildren.splice(targetIndex, 0, movedItem);
                  return { ...item, children: newChildren };
                } else if (item.children) {
                  return { ...item, children: reorderWithinSameParent(item.children) };
                }
                return item;
              });
            }

            // Handle root level reordering
            if (draggedParentArray === prevItems) {
              const newItems = [...prevItems];
              const [movedItem] = newItems.splice(draggedIndex, 1);
              newItems.splice(targetIndex, 0, movedItem);
              return newItems;
            } else {
              return reorderWithinSameParent(updatedItems);
            }
          }

          // If moving between different parent arrays, we need more complex logic
          // For now, return original items (this case is more complex and might need the existing "over" logic)
          return prevItems;
        });

        break;
      }

      case 'over': {
        const { droppedOnItemId, draggedItemIdsPath } = itemDropEvent;

        setItems((prevItems) => {
          const droppedOnIndex = prevItems.findIndex((item) => item.id === droppedOnItemId);

          if (droppedOnIndex === -1) {
            return prevItems;
          }

          const updatedItems = [...prevItems];

          // Remove dragged item from its current position
          let draggedItem: Item | null = null;

          function removeItemRecursively(items: Item[], idsPath: string[]): Item[] {
            return items.filter((item) => {
              if (item.id === idsPath[0]) {
                if (idsPath.length === 1) {
                  draggedItem = item;
                  return false; // Remove this item
                } else if (item.children) {
                  item.children = removeItemRecursively(item.children, idsPath.slice(1));
                }
              }
              return true; // Keep this item
            });
          }

          const itemsWithoutDragged = removeItemRecursively(updatedItems, draggedItemIdsPath);

          if (!draggedItem) {
            return prevItems; // Dragged item not found, return original list
          }

          // Insert dragged item as a child of the dropped-on item
          function insertItemRecursively(items: Item[]): Item[] {
            return items.map((item) => {
              if (item.id === droppedOnItemId) {
                const children = item.children ? [...item.children, draggedItem!] : [draggedItem!];
                return { ...item, children };
              } else if (item.children) {
                return { ...item, children: insertItemRecursively(item.children) };
              }
              return item;
            });
          }

          return insertItemRecursively(itemsWithoutDragged);
        });

        break;
      }
    }
  }, []);

  return (
    <div 
      className="p-4 rounded bg-gray-900 max-h-[600px] overflow-y-auto" 
      style={{ '--cpl-dnd-sort-list-item-height': '50px' } as React.CSSProperties}
      /*  onDragStart={suppressNativeDrag} */
    >
      <div className="sortable-list flex flex-col">
        {flatItems.map((item) => (
          <DraggableListItem
            key={item.id}
            item={item}
            onItemDrop={handleItemDrop}
            draggingItemId={draggingItemId}
            onDraggingItemId={setDraggingItemId}
            className="w-120"
          >
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
              <div className={clsx('flex-1', 'min-w-0', 'select-text')}>{item.content}</div>
            </div>
          </DraggableListItem>
        ))}
      </div>
      {/* <DragOverlay drag={drag} renderContent={(id) => items.find((item) => item.id === id)?.content} /> */}
    </div>
  );
};

type HandleItemDropEvent =
  | { kind: 'below'; draggedItemId: string; targetItemId: string }
  | { kind: 'over'; draggedItemIdsPath: string[]; droppedOnItemId: string };

function DraggableListItem({
  item,
  onItemDrop,
  draggingItemId,
  onDraggingItemId,
  children,
  className,
}: {
  item: FlattenTreeNode<Item, 'id'>;
  onItemDrop: (handleItemDropEvent: HandleItemDropEvent) => void;
  draggingItemId: string | null;
  onDraggingItemId: (id: string | null) => void;
  children: ReactNode;
  className?: string;
}) {
  // const [isDragging, setIsDragging] = useState(false);

  const isDragging = draggingItemId === item.id;

  const isParentDroppable = Boolean(item.children?.length);

  return (
    <Fragment key={item.id}>
      <div
        key={item.id}
        className={clsx(className, CPL_DRAG_ITEM_CLASS_NAME, isDragging && 'opacity-50')}
        style={{ paddingLeft: item.level * 16 }}
        draggable={true}
        onDragStart={(event) => {
          // setIsDragging(true);
          onDraggingItemId(item.id);
          event.dataTransfer.setData(ITEM_DATA_TRANSFER_KEY, JSON.stringify(item));
        }}
        onDragEnd={(event) => {
          // setIsDragging(false);
          onDraggingItemId(null);
          event.dataTransfer.clearData();
        }}
        {...(isParentDroppable
          ? {
              onDragOver: (event) => {
                // This enables dropping
                event.preventDefault();
              },
              onDragEnter: (event: DragEvent<HTMLDivElement>) => {
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

                const draggedItem = JSON.parse(event.dataTransfer.getData(ITEM_DATA_TRANSFER_KEY)) as FlattenTreeNode<
                  Item,
                  'id'
                >;

                if (!draggedItem) {
                  return;
                }

                onItemDrop({
                  kind: 'over',
                  draggedItemIdsPath: draggedItem.ids,
                  droppedOnItemId: item.id,
                });

                event.dataTransfer.clearData();
              },
            }
          : {})}
      >
        {children}
      </div>
      {isParentDroppable ? (
        <div style={{ height: 4 }} />
      ) : (
        <div
          className={clsx(styles.dividerWrapper)}
          {...{
            onDragOver: (event) => {
              // This enables dropping
              event.preventDefault();
            },
            onDragEnterCapture: (event: DragEvent<HTMLDivElement>) => {
              console.log(event);

              (event.target as HTMLDivElement)?.classList.add(CPL_DRAGGING_OVER_LIST_DIVIDER_CLASS_NAME);
            },
            onDragLeave: (event: DragEvent<HTMLDivElement>) => {
              (event.target as HTMLDivElement).classList.remove(CPL_DRAGGING_OVER_LIST_DIVIDER_CLASS_NAME);
            },
            onDrop: (event: DragEvent<HTMLDivElement>) => {
              event.preventDefault();

              (event.target as HTMLDivElement).classList.remove(CPL_DRAGGING_OVER_LIST_DIVIDER_CLASS_NAME);

              const draggedItemData = event.dataTransfer.getData(ITEM_DATA_TRANSFER_KEY);

              if (!draggedItemData) {
                return;
              }

              const draggedItem = JSON.parse(draggedItemData) as FlattenTreeNode<Item, 'id'>;

              onItemDrop({
                kind: 'below',
                targetItemId: item.id,
                draggedItemId: draggedItem.id,
              });

              event.dataTransfer.clearData();
            },
          }}
        />
      )}
    </Fragment>
  );
}

function getDroppableListItem(event: DragEvent<HTMLDivElement>) {
  console.log(event.target);

  return (event.target as HTMLElement).closest(`.${CPL_DRAG_ITEM_CLASS_NAME}`) as HTMLDivElement | null;
}

const CPL_DRAG_ITEM_CLASS_NAME = 'cpl-dragitem';
const CPL_DRAGGING_OVER_LIST_ITEM_CLASS_NAME = styles.draggingOverListItem;
const CPL_DRAGGING_OVER_LIST_DIVIDER_CLASS_NAME = styles.draggingOverListDivider;
const ITEM_DATA_TRANSFER_KEY = 'item-id';
