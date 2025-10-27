'use client';

import { TreeNode } from '@/app/utilities/build-tree-node';
import { FlattenTreeNode, isExpanded } from '@/app/utilities/flatten-tree-2';
import clsx from 'clsx';
import { DragEvent, Fragment, useCallback, useMemo, useState, type FC } from 'react';
import { moveItemAsChild, placeItemsBeforeTarget } from './list-4.utils';
import styles from './pointer-sortable-list-5.module.css';
import { Item } from './types';

interface PointerSortableListProps {
  initial: Item[];
}

const idKey = 'id';

export const PointerSortableList5: FC<PointerSortableListProps> = ({ initial }) => {
  const itemsIdMap = useMemo(() => {
    const map = new Map<string, Item>();

    initial.forEach((item) => map.set(item.id, item));

    return map;
  }, []);

  const [items, setItems] = useState<Item[]>(initial);

  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const handleItemDrop = useCallback((itemDropEvent: HandleItemDropEvent<Item, typeof idKey>) => {
    const { kind } = itemDropEvent;

    console.log('Dropped:', itemDropEvent);

    switch (kind) {
      case 'below': {
        const { draggedItemIdsPath, droppedBelowItemIdsPath } = itemDropEvent;

        const updatedItems = placeItemsBeforeTarget(items, idKey, draggedItemIdsPath, droppedBelowItemIdsPath);

        setItems(updatedItems);

        break;
      }

      case 'over': {
        const { draggedItemIdsPath, droppedOnItemIdsPath } = itemDropEvent;

        const updatedItems = moveItemAsChild(items, idKey, draggedItemIdsPath, droppedOnItemIdsPath);
        setItems(updatedItems);

        break;
      }
    }
  }, []);

  return (
    <div className="p-4 rounded bg-gray-900 max-h-[80dvh] overflow-y-auto">
      <div className="sortable-list flex flex-col">
        {items.map((item, index) => {
          return (
            <DraggableListItem
              key={item[idKey]}
              idKey={idKey}
              allowPlacementBeforeSelf={index === 0}
              item={item}
              expandedState={expandedState}
              onItemDrop={handleItemDrop}
              draggingItemId={draggingItemId}
              onDraggingItemId={setDraggingItemId}
              className="w-120"
              renderItem={({ item }) => {
                const id = item[idKey];

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
                    )}
                  >
                    {item.children?.length && (
                      <button
                        onClick={() => {
                          setExpandedState((prev) => ({ ...prev, [id]: !isExpanded(prev, id) }));
                        }}
                      >
                        {isExpanded(expandedState, id) ? 'COL' : 'EXP'}
                      </button>
                    )}
                    <div className={clsx('flex-1', 'min-w-0', 'select-none')}>{item.content}</div>
                    {draggingItemId === id && !!item.children?.length && (
                      <span className="text-sm italic">({item.children?.length} items)</span>
                    )}
                  </div>
                );
              }}
            ></DraggableListItem>
          );
        })}
      </div>
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
  expandedState,
  className,
  renderItem,
  allowPlacementBeforeSelf,
  level = 0,
  ids = [item[idKey]],
  childLevelMarginStep = 16,
}: {
  idKey: K;
  item: TreeNode<T>;
  onItemDrop: (handleItemDropEvent: HandleItemDropEvent<T, K>) => void;
  draggingItemId: T[K] | null;
  onDraggingItemId: (id: T[K] | null) => void;
  expandedState: Record<string, boolean>;
  renderItem: ({ item }: { item: TreeNode<T> }) => React.ReactNode;
  allowPlacementBeforeSelf: boolean;
  className?: string;
  level?: number;
  ids?: T[K][];
  /**
   * @default 16
   */
  childLevelMarginStep?: number;
}) {
  const isDragging = draggingItemId === item[idKey];

  return (
    <Fragment key={String(item[idKey])}>
      {allowPlacementBeforeSelf && (
        <div
          className={clsx(styles.dividerWrapper)}
          style={{ paddingLeft: level * childLevelMarginStep }}
          {...{
            onDragOver: (event) => {
              // This enables dropping
              event.preventDefault();
            },
            onDragEnter: (event: DragEvent<HTMLDivElement>) => {
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
                droppedBelowItemIdsPath: ids,
              });

              event.dataTransfer.clearData();
            },
          }}
        />
      )}
      <div
        className={clsx(className, CPL_DRAG_ITEM_CLASS_NAME, isDragging && 'opacity-50')}
        style={{ paddingLeft: level * childLevelMarginStep, cursor: 'grab' }}
        draggable={true}
        onDragStart={(event) => {
          onDraggingItemId(item[idKey]);
          event.dataTransfer.setData(ITEM_DATA_TRANSFER_KEY, JSON.stringify({ ...item, ids }));
        }}
        onDragEnd={(event) => {
          onDraggingItemId(null);
          event.dataTransfer.clearData();
        }}
        data-is-dragging={isDragging ? 'true' : 'false'}
        {...(true
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

                console.log('Dragged item:', draggedItem);

                if (!draggedItem) {
                  return;
                }

                onItemDrop({
                  kind: 'over',
                  draggedItemIdsPath: draggedItem.ids,
                  droppedOnItemId: item[idKey],
                  droppedOnItemIdsPath: ids,
                });

                event.dataTransfer.clearData();
              },
            }
          : {})}
      >
        {renderItem({ item })}
      </div>
      <div
        className={clsx(styles.dividerWrapper)}
        style={{ paddingLeft: level * childLevelMarginStep }}
        {...{
          onDragOver: (event) => {
            // This enables dropping
            event.preventDefault();
          },
          onDragEnter: (event: DragEvent<HTMLDivElement>) => {
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
              droppedBelowItemIdsPath: ids,
            });

            event.dataTransfer.clearData();
          },
        }}
      />
      {item.children?.length &&
        isExpanded(expandedState, item[idKey]) &&
        item.children.map((item, index) => {
          return (
            <DraggableListItem
              key={String(item[idKey])}
              idKey={idKey}
              allowPlacementBeforeSelf={index === 0}
              item={item}
              onItemDrop={onItemDrop}
              draggingItemId={draggingItemId}
              onDraggingItemId={onDraggingItemId}
              expandedState={expandedState}
              className="w-120"
              renderItem={renderItem}
              ids={[...ids, item[idKey]]}
              level={level + 1}
            />
          );
        })}
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
