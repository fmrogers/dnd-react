'use client';

import { TreeNode } from '@/app/utilities/build-tree-node';
import { objectHasOwnProperty } from '@/app/utilities/object-has-own-property';
import clsx from 'clsx';
import { Dispatch, DragEvent, SetStateAction, useCallback, useState } from 'react';
import { moveItemAsChild, placeItemsBeforeTarget, placeItemsBeforeTargetActually } from './list-4.utils';
import styles from './pointer-sortable-list-native.module.css';
import { ColumnDef } from './types';

interface PointerSortableListProps<T, K extends keyof T> {
  initial: T[];
  /**
   * The unique identifier key for each item in the list.
   *
   * @example
   * 'id'
   */
  uniqueIdentifierKey: K extends keyof T ? (T[K] extends string ? K : never) : never;
  columns: ColumnDef<T, any>[];
  draggableRowClassName: string;
}

type FlattenTreeNode<T, K extends keyof T> = T & { level: number; ids: T[K][] };

export function SortableTree<T extends { children?: T[] }, K extends keyof T>({
  initial,
  uniqueIdentifierKey,
  columns,
  draggableRowClassName,
}: PointerSortableListProps<T, K>) {
  const [items, setItems] = useState<T[]>(initial);

  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  const handleItemDrop = useCallback(
    (itemDropEvent: HandleItemDropEvent<T, K>) => {
      const { kind } = itemDropEvent;

      console.log('Dropped:', itemDropEvent);

      switch (kind) {
        case 'below': {
          const { draggedItemIdsPath, droppedBelowItemIdsPath } = itemDropEvent;

          const updatedItems = placeItemsBeforeTarget(
            items,
            uniqueIdentifierKey,
            draggedItemIdsPath,
            droppedBelowItemIdsPath,
          );

          setItems(updatedItems);

          break;
        }

        case 'over': {
          const { draggedItemIdsPath, droppedOnItemIdsPath } = itemDropEvent;

          const updatedItems = moveItemAsChild(items, uniqueIdentifierKey, draggedItemIdsPath, droppedOnItemIdsPath);
          setItems(updatedItems);

          break;
        }

        case 'above': {
          const { draggedItemIdsPath, droppedAboveItemIdsPath } = itemDropEvent;

          const updatedItems = placeItemsBeforeTargetActually(
            items,
            uniqueIdentifierKey,
            draggedItemIdsPath,
            droppedAboveItemIdsPath,
          );

          setItems(updatedItems);

          break;
        }
      }
    },
    [items, uniqueIdentifierKey],
  );

  return (
    <div className="p-4 rounded bg-gray-900 max-h-[80dvh] overflow-y-auto">
      <table className="w-120">
        <tbody>
          {items.map((item, index) => (
            <DraggableRow
              key={String(item[uniqueIdentifierKey])}
              uniqueIdentifierKey={uniqueIdentifierKey}
              allowPlacementBeforeSelf={index === 0}
              item={item}
              expandedState={expandedState}
              setExpandedState={setExpandedState}
              onItemDrop={handleItemDrop}
              className="w-120"
              columns={columns}
              draggableRowClassName={draggableRowClassName}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type HandleItemDropEvent<T, K extends keyof T> =
  | { kind: 'below'; draggedItemIdsPath: T[K][]; droppedBelowItemIdsPath: T[K][] }
  | { kind: 'above'; draggedItemIdsPath: T[K][]; droppedAboveItemIdsPath: T[K][] }
  | { kind: 'over'; draggedItemIdsPath: T[K][]; droppedOnItemId: T[K]; droppedOnItemIdsPath: T[K][] };

type OnItemDrop<T, K extends keyof T> = (handleItemDropEvent: HandleItemDropEvent<T, K>) => void;

function DraggableRow<T extends { children?: T[] }, K extends keyof T>({
  uniqueIdentifierKey,
  item,
  onItemDrop,
  expandedState,
  setExpandedState,
  columns,
  className,
  allowPlacementBeforeSelf,
  allowDropping = true,
  level = 0,
  ids = [item[uniqueIdentifierKey]],
  childLevelMarginStep = 16,
  draggableRowClassName,
}: {
  uniqueIdentifierKey: K;
  item: TreeNode<T>;
  onItemDrop: OnItemDrop<T, K>;
  expandedState: Record<string, boolean>;
  setExpandedState: Dispatch<SetStateAction<Record<string, boolean>>>;
  allowPlacementBeforeSelf: boolean;
  draggableRowClassName: string;
  allowDropping?: boolean;
  className?: string;
  level?: number;
  ids?: T[K][];
  /**
   * @default 16
   */
  childLevelMarginStep?: number;
  columns: ColumnDef<T, any>[];
}) {
  // const isDragging = draggingItemId === item[uniqueIdentifierKey];
  const [isDragging, setIsDragging] = useState(false);

  return (
    <>
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
      <tr
        className={clsx(className, CPL_DRAG_ITEM_CLASS_NAME, isDragging && 'opacity-50', draggableRowClassName)}
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
                droppedOnItemId: item[uniqueIdentifierKey],
                droppedOnItemIdsPath: ids,
              });

              event.dataTransfer.clearData();
            },
          })}
      >
        {columns.map((columnDef) => {
          switch (columnDef.type) {
            case 'accessor': {
              return (
                <td key={`${item[uniqueIdentifierKey]}-${columnDef.key}`}>
                  {columnDef.cell({
                    row: {
                      original: item,
                      isDragging,
                      childLevel: 0,
                      isExpanded: isExpanded(expandedState, String(item[uniqueIdentifierKey])),
                      toggleExpanded: () =>
                        setExpandedState((prev) => ({
                          ...prev,
                          [String(item[uniqueIdentifierKey])]: !isExpanded(prev, String(item[uniqueIdentifierKey])),
                        })),
                    },
                    getValue: () => item[columnDef.key as keyof T],
                  })}
                </td>
              );
            }

            case 'display': {
              return null;
            }
          }
        })}
      </tr>
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
        isExpanded(expandedState, item[uniqueIdentifierKey]) &&
        item.children.map((item, index) => {
          return (
            <DraggableRow
              key={String(item[uniqueIdentifierKey])}
              uniqueIdentifierKey={uniqueIdentifierKey}
              allowDropping={allowDropping && !isDragging}
              allowPlacementBeforeSelf={index === 0}
              item={item}
              draggableRowClassName={draggableRowClassName}
              onItemDrop={onItemDrop}
              expandedState={expandedState}
              setExpandedState={setExpandedState}
              columns={columns}
              className="w-120"
              ids={[...ids, item[uniqueIdentifierKey]]}
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
    </>
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
    <tr
      style={{
        marginLeft: level * childLevelMarginStep,
        pointerEvents: disabled ? 'none' : undefined,
        position: 'relative',
        height: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
      }}
    >
      {false ? (
        <td />
      ) : (
        <td
          className={clsx(styles.dividerWrapper)}
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
      )}
    </tr>
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
