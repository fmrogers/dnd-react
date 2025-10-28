'use client';

import { TreeNode } from '@/app/utilities/build-tree-node';
import { objectHasOwnProperty } from '@/app/utilities/object-has-own-property';
import clsx from 'clsx';
import { DragEvent, Fragment, useCallback, useMemo, useState, type FC } from 'react';
import { moveItemAsChild, placeItemsBeforeTarget, placeItemsBeforeTargetActually } from './list-4.utils';
import styles from './pointer-sortable-list-native.module.css';
import { Item } from './types';

interface PointerSortableListProps {
  initial: Item[];
}

export type FlattenTreeNode<T, K extends keyof T> = T & { level: number; ids: T[K][] };

const idKey = 'id';

export const PointerSortableListNative: FC<PointerSortableListProps> = ({ initial }) => {
  const [clickedItem, setClickedItem] = useState<Item | null>(null);

  const itemsIdMap = useMemo(() => {
    const map = new Map<string, Item>();

    initial.forEach((item) => map.set(item.id, item));

    return map;
  }, []);

  const [items, setItems] = useState<Item[]>(initial);

  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  const handleItemDrop = useCallback(
    (itemDropEvent: HandleItemDropEvent<Item, typeof idKey>) => {
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

        case 'above': {
          const { draggedItemIdsPath, droppedAboveItemIdsPath } = itemDropEvent;

          const updatedItems = placeItemsBeforeTargetActually(
            items,
            idKey,
            draggedItemIdsPath,
            droppedAboveItemIdsPath,
          );

          setItems(updatedItems);

          break;
        }
      }
    },
    [items, idKey],
  );

  return (
    <>
      <div className="p-4 rounded bg-gray-900 max-h-[80dvh] overflow-y-auto">
        <div className="flex flex-col">
          {items.map((item, index) => {
            return (
              <DraggableListItem
                key={item[idKey]}
                idKey={idKey}
                allowPlacementBeforeSelf={index === 0}
                item={item}
                expandedState={expandedState}
                onItemDrop={handleItemDrop}
                className="w-120"
                renderItem={({ item, isDragging }) => {
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
                      {item.children?.length ? (
                        <button
                          style={{ width: 16 }}
                          onClick={() => {
                            setExpandedState((prev) => ({ ...prev, [id]: !isExpanded(prev, id) }));
                          }}
                        >
                          {isExpanded(expandedState, id) ? 'V' : '>'}
                        </button>
                      ) : (
                        <div style={{ width: 16 }} />
                      )}
                      <button
                        className={clsx('min-w-0', 'select-none', 'inline-block', 'text-left', 'cursor-pointer')}
                        onClick={(event) => {
                          event.preventDefault();
                          setClickedItem(item);
                        }}
                        onDrag={(event) => event.preventDefault()}
                      >
                        {item.content}
                      </button>
                      {isDragging && !!item.children?.length && (
                        <span className="text-sm italic">({item.children?.length} items)</span>
                      )}
                    </div>
                  );
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="w-64 ml-4">
        {clickedItem && (
          <>
            <button onClick={() => setClickedItem(null)}>Close</button>
            <br />
            Clicked on: <pre>{JSON.stringify(clickedItem.content, null, 2)}</pre>
          </>
        )}
      </div>
    </>
  );
};

type HandleItemDropEvent<T, K extends keyof T> =
  | { kind: 'below'; draggedItemIdsPath: T[K][]; droppedBelowItemIdsPath: T[K][] }
  | { kind: 'above'; draggedItemIdsPath: T[K][]; droppedAboveItemIdsPath: T[K][] }
  | { kind: 'over'; draggedItemIdsPath: T[K][]; droppedOnItemId: T[K]; droppedOnItemIdsPath: T[K][] };

type OnItemDrop<T, K extends keyof T> = (handleItemDropEvent: HandleItemDropEvent<T, K>) => void;

function DraggableListItem<T extends { children?: T[] }, K extends keyof T>({
  idKey,
  item,
  onItemDrop,
  expandedState,
  className,
  renderItem,
  allowPlacementBeforeSelf,
  allowDropping = true,
  level = 0,
  ids = [item[idKey]],
  childLevelMarginStep = 16,
}: {
  idKey: K;
  item: TreeNode<T>;
  onItemDrop: OnItemDrop<T, K>;
  expandedState: Record<string, boolean>;
  renderItem: ({ item, isDragging }: { item: TreeNode<T>; isDragging: boolean }) => React.ReactNode;
  allowPlacementBeforeSelf: boolean;
  allowDropping?: boolean;
  className?: string;
  level?: number;
  ids?: T[K][];
  /**
   * @default 16
   */
  childLevelMarginStep?: number;
}) {
  // const isDragging = draggingItemId === item[idKey];
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Fragment key={String(item[idKey])}>
      {allowPlacementBeforeSelf ? (
        <Divider
          childLevelMarginStep={childLevelMarginStep}
          ids={ids}
          level={level}
          onItemDrop={onItemDrop}
          direction="above"
          disabled={isDragging || !allowDropping}
        />
      ) : null}
      <div
        className={clsx(className, CPL_DRAG_ITEM_CLASS_NAME, isDragging && 'opacity-50')}
        style={{ paddingLeft: level * childLevelMarginStep, cursor: 'grab' }}
        draggable={true}
        onDragStart={(event) => {
          setIsDragging(true);
          event.dataTransfer.setData(ITEM_DATA_TRANSFER_KEY, JSON.stringify({ ...item, ids }));
        }}
        onDragEnd={(event) => {
          setIsDragging(false);
          event.dataTransfer.clearData();
        }}
        {...(isDragging && { 'data-is-dragging': true })}
        {...(allowDropping &&
          !isDragging && {
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
          })}
      >
        {renderItem({ item, isDragging })}
      </div>
      {!item.children?.length ? (
        <Divider
          childLevelMarginStep={childLevelMarginStep}
          ids={ids}
          level={level}
          onItemDrop={onItemDrop}
          direction="below"
          disabled={isDragging || !allowDropping}
        />
      ) : null}
      {!!item.children?.length &&
        isExpanded(expandedState, item[idKey]) &&
        item.children.map((item, index) => {
          return (
            <DraggableListItem
              key={String(item[idKey])}
              idKey={idKey}
              allowDropping={allowDropping && !isDragging}
              allowPlacementBeforeSelf={index === 0}
              item={item}
              onItemDrop={onItemDrop}
              expandedState={expandedState}
              className="w-120"
              renderItem={renderItem}
              ids={[...ids, item[idKey]]}
              level={level + 1}
            />
          );
        })}
      {!!item.children?.length ? (
        <Divider
          childLevelMarginStep={childLevelMarginStep}
          ids={ids}
          level={level}
          onItemDrop={onItemDrop}
          direction="below"
          disabled={isDragging || !allowDropping}
        />
      ) : null}
    </Fragment>
  );
}

function Divider<T, K extends keyof T>({
  level,
  childLevelMarginStep,
  ids,
  onItemDrop,
  direction,
  disabled,
}: {
  level: number;
  childLevelMarginStep: number;
  onItemDrop: OnItemDrop<T, K>;
  ids: T[K][];
  direction: 'above' | 'below';
  disabled: boolean;
}) {
  return (
    <div
      className={clsx(styles.dividerWrapper)}
      style={{ marginLeft: level * childLevelMarginStep, pointerEvents: disabled ? 'none' : undefined }}
      {...{
        onDragOver: (event) => {
          // This enables dropping
          event.preventDefault();
        },
        onDragEnter: (event: DragEvent<HTMLDivElement>) => {
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

          if (direction === 'above') {
            onItemDrop({
              kind: direction,
              draggedItemIdsPath: draggedItem.ids,
              droppedAboveItemIdsPath: ids,
            });
          } else {
            onItemDrop({
              kind: direction,
              draggedItemIdsPath: draggedItem.ids,
              droppedBelowItemIdsPath: ids,
            });
          }

          event.dataTransfer.clearData();
        },
      }}
    />
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

export function isExpanded(expandedState: Record<string, boolean>, id: unknown) {
  return !objectHasOwnProperty(expandedState, String(id)) || expandedState[String(id)] === true;
}
