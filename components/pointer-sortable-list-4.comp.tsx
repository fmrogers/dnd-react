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
        const { draggedItemIdsPath, droppedBelowItemIdsPath } = itemDropEvent;

        const prevItems = items;

        const updatedItems = [...prevItems];

        // Find and pop dragged item
        let draggedItem: Item | null = null;
        let visitingItem = updatedItems.find((item) => item.id === draggedItemIdsPath[0]);

        for (let i = 1; i < draggedItemIdsPath.length; i++) {
          const draggedItemId = draggedItemIdsPath[i];

          if (draggedItemId === undefined || !visitingItem?.children?.length) {
            throw new Error(`Cannot find dragged item with id ${draggedItemId}`);
          }

          const currentItemIndex = visitingItem.children.findIndex((child) => child.id === draggedItemId);

          if (currentItemIndex === -1) {
            throw new Error(`Cannot find dragged item with id ${draggedItemId}`);
          }

          const currentItem = visitingItem.children[currentItemIndex];

          if (!currentItem) {
            throw new Error(`Cannot find dragged item with id ${draggedItemId}`);
          }

          const isLastId = i === draggedItemIdsPath.length - 1;

          if (!isLastId) {
            visitingItem = currentItem;
            break;
          }

          // Last id
          // visitingItem.children = visitingItem.children?.filter((child) => child.id !== draggedItemId);
          visitingItem.children = visitingItem.children.filter((child) => child.id !== draggedItemId);
          draggedItem = currentItem;
          visitingItem = undefined;
          break;
        }

        if (!draggedItem) {
          return prevItems; // Dragged item not found, return original list
        }

        // Find and pop dragged item
        let droppedOnParentItem: Item | null = null;
        visitingItem = updatedItems.find((item) => item.id === droppedBelowItemIdsPath[0]);

        if (droppedBelowItemIdsPath.length === 2 && visitingItem) {
          droppedOnParentItem = visitingItem;
        }

        for (let i = 1; i < droppedBelowItemIdsPath.length - 1; i++) {
          const droppedOnItemId = droppedBelowItemIdsPath[i];

          if (droppedOnItemId === undefined || !visitingItem?.children?.length) {
            break;
          }

          const currentItemIndex = visitingItem.children.findIndex((child) => child.id === droppedOnItemId);

          if (currentItemIndex === -1) {
            break;
          }

          const currentItem = visitingItem.children[currentItemIndex];

          if (!currentItem) {
            break;
          }

          const isLastId = i === droppedBelowItemIdsPath.length - 2;

          if (isLastId) {
            currentItem.children = visitingItem.children.filter((child) => child.id !== droppedOnItemId);
            draggedItem = currentItem;
            break;
          }

          visitingItem = currentItem;
        }

        debugger;

        const lastDroppedOnId = droppedBelowItemIdsPath[droppedBelowItemIdsPath.length - 1];

        if (droppedOnParentItem) {
          const droppedOnIndex = droppedOnParentItem.children?.findIndex((child) => child.id === lastDroppedOnId);

          if (droppedOnIndex === undefined || droppedOnIndex === -1) {
            throw new Error(`Cannot find dropped-on item with id ${lastDroppedOnId}`);
          }

          droppedOnParentItem.children?.splice(droppedOnIndex + 1, 0, draggedItem);
        } else {
          const droppedOnIndex = updatedItems.findIndex((item) => item.id === lastDroppedOnId);

          if (droppedOnIndex === -1) {
            throw new Error(`Cannot find dropped-on item with id ${lastDroppedOnId}`);
          }

          updatedItems.splice(droppedOnIndex + 1, 0, draggedItem);
        }

        setItems(updatedItems);

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
  | { kind: 'below'; draggedItemIdsPath: string[]; droppedBelowItemIdsPath: string[] }
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
                draggedItemIdsPath: draggedItem.ids,
                droppedBelowItemIdsPath: item.ids,
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
