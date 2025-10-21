'use client';

import { flattenTree, FlattenTreeNode } from '@/app/utilities/flatten-tree-2';
import clsx from 'clsx';
import { DragEvent, Fragment, ReactNode, useCallback, useMemo, useState, type FC } from 'react';
import { placeItemsBeforeTarget } from './list-4.utils';
import styles from './pointer-sortable-list.module.css';

interface Item {
  id: string;
  content: string;
  children?: Item[];
}

interface PointerSortableListProps {
  initial: Item[];
}

const idKey = 'id';

export const PointerSortableList4: FC<PointerSortableListProps> = ({ initial }) => {
  const itemsIdMap = useMemo(() => {
    const map = new Map<string, Item>();

    initial.forEach((item) => map.set(item.id, item));

    return map;
  }, []);

  const [items, setItems] = useState<Item[]>(initial);

  const flatItems = useMemo(() => {
    return flattenTree(items, idKey);
  }, [items]);

  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const handleItemDrop = useCallback((itemDropEvent: HandleItemDropEvent<Item, typeof idKey>) => {
    const { kind } = itemDropEvent;

    switch (kind) {
      case 'below': {
        const { draggedItemIdsPath, droppedBelowItemIdsPath } = itemDropEvent;

        const prevItems = items;

        const updatedItems = placeItemsBeforeTarget(prevItems, idKey, draggedItemIdsPath, droppedBelowItemIdsPath);

        setItems(updatedItems);

        break;
      }

      case 'over': {
        const { droppedOnItemId, draggedItemIdsPath, droppedOnItemIdsPath } = itemDropEvent;

        const nodeIsDroppedOnItself =
          draggedItemIdsPath.length === droppedOnItemIdsPath.length &&
          draggedItemIdsPath.every((id, index) => id === droppedOnItemIdsPath[index]);

        if (nodeIsDroppedOnItself) {
          return;
        }

        setItems((prevItems) => {
          const droppedOnIndex = prevItems.findIndex((item) => item[idKey] === droppedOnItemId);

          if (droppedOnIndex === -1) {
            return prevItems;
          }

          const updatedItems = [...prevItems];

          // Remove dragged item from its current position
          let draggedItem: Item | null = null;

          function removeItemRecursively(items: Item[], idsPath: string[]): Item[] {
            return items.filter((item) => {
              if (item[idKey] === idsPath[0]) {
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
              if (item[idKey] === droppedOnItemId) {
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
    <div className="p-4 rounded bg-gray-900 max-h-[80dvh] overflow-y-auto">
      <div className="sortable-list flex flex-col">
        {flatItems.map((item) => (
          <DraggableListItem
            key={item[idKey]}
            idKey={idKey}
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

type HandleItemDropEvent<T, K extends keyof T> =
  | { kind: 'below'; draggedItemIdsPath: T[K][]; droppedBelowItemIdsPath: T[K][] }
  | { kind: 'over'; draggedItemIdsPath: T[K][]; droppedOnItemId: T[K]; droppedOnItemIdsPath: T[K][] };

function DraggableListItem<T extends { children?: T[] }, K extends keyof T>({
  idKey,
  item,
  onItemDrop,
  draggingItemId,
  onDraggingItemId,
  children,
  className,
  childLevelMarginStep = 16,
}: {
  idKey: K;
  item: FlattenTreeNode<T, K>;
  onItemDrop: (handleItemDropEvent: HandleItemDropEvent<T, K>) => void;
  draggingItemId: T[K] | null;
  onDraggingItemId: (id: T[K] | null) => void;
  children: ReactNode;
  className?: string;
  /**
   * @default 16
   */
  childLevelMarginStep?: number;
}) {
  // const [isDragging, setIsDragging] = useState(false);

  const isDragging = draggingItemId === item[idKey];

  const isParentDroppable = Boolean(item.children?.length);

  return (
    <Fragment key={String(item[idKey])}>
      <div
        className={clsx(className, CPL_DRAG_ITEM_CLASS_NAME, isDragging && 'opacity-50')}
        style={{ paddingLeft: item.level * childLevelMarginStep, cursor: 'grab' }}
        draggable={true}
        onDragStart={(event) => {
          // setIsDragging(true);
          onDraggingItemId(item[idKey]);
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
                  T,
                  K
                >;

                if (!draggedItem) {
                  return;
                }

                onItemDrop({
                  kind: 'over',
                  draggedItemIdsPath: draggedItem.ids,
                  droppedOnItemId: item[idKey],
                  droppedOnItemIdsPath: item.ids,
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

              const draggedItem = JSON.parse(draggedItemData) as FlattenTreeNode<T, K>;

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
