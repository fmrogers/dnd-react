'use client';

import { FlattenTreeNode, flattenTreeWithExpandedState, isExpanded } from '@/app/utilities/flatten-tree-2';
import clsx from 'clsx';
import { DragEvent, Fragment, ReactNode, RefObject, useCallback, useMemo, useRef, useState, type FC } from 'react';
import { moveItemAsChild, placeItemsBeforeTarget } from './list-4.utils';
import styles from './pointer-sortable-list.module.css';
import { Item } from './types';

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

  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  const flatItems = useMemo(() => {
    return flattenTreeWithExpandedState(items, idKey, expandedState);
  }, [items, expandedState]);

  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const handleItemDrop = useCallback((itemDropEvent: HandleItemDropEvent<Item, typeof idKey>) => {
    const { kind } = itemDropEvent;

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

  const draggableElementOverlayRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="p-4 rounded bg-gray-900 max-h-[80dvh] overflow-y-auto"
      // onScroll={(event) => {
      //   console.log((event.target.querySelector("[data-is-dragging='true']") as HTMLDivElement)?.remove());
      // }}
    >
      <div className="sortable-list flex flex-col">
        {/* <DragOverlay4 item={itemsIdMap.get(draggingItemId ?? '')} ref3={draggableElementOverlayRef} /> */}
        {flatItems.map((item) => {
          const id = item[idKey];

          return (
            <DraggableListItem
              key={id}
              idKey={idKey}
              item={item}
              onItemDrop={handleItemDrop}
              draggingItemId={draggingItemId}
              onDraggingItemId={setDraggingItemId}
              className="w-120"
              draggableElementOverlayRef={draggableElementOverlayRef}
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
                {draggingItemId === id && <span className="text-sm italic">({item.children?.length} items)</span>}
              </div>
            </DraggableListItem>
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
  children,
  className,
  childLevelMarginStep = 16,
  draggableElementOverlayRef,
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
  draggableElementOverlayRef?: RefObject<HTMLDivElement | null>;
}) {
  // const [isDragging, setIsDragging] = useState(false);

  const isDragging = draggingItemId === item[idKey];

  const isParentDroppable = true; //  Boolean(item.children?.length);

  return (
    <Fragment key={String(item[idKey])}>
      <div
        className={clsx(className, CPL_DRAG_ITEM_CLASS_NAME, isDragging && 'opacity-50')}
        style={{ paddingLeft: item.level * childLevelMarginStep, cursor: 'grab' }}
        draggable={true}
        onDragStartCapture={(event) => {
          // setIsDragging(true);
          onDraggingItemId(item[idKey]);
          // console.log(event);
          // console.log(event.target.clientTop);
          // console.log(event.target.clientLeft);
          // console.log(draggableElementOverlayRef);
          // if (draggableElementOverlayRef?.current) {
          //   event.preventDefault();
          //   draggableElementOverlayRef.current.dispatchEvent(
          //     new DragEvent('dragstart', {
          //       bubbles: true,
          //       cancelable: true,
          //       dataTransfer: event.dataTransfer,
          //       clientX: event.clientX,
          //       clientY: event.clientY,
          //       movementX: event.movementX,
          //       movementY: event.movementY,
          //       screenX: event.screenX,
          //       screenY: event.screenY,
          //       view: event.view,
          //       altKey: event.altKey,
          //       ctrlKey: event.ctrlKey,
          //       metaKey: event.metaKey,
          //       shiftKey: event.shiftKey,
          //       button: event.button,
          //       buttons: event.buttons,
          //       composed: event.composed,
          //       detail: event.detail,
          //       relatedTarget: event.relatedTarget,
          //     }),
          //   );
          // }
          // new DragEvent('dragstart', {});
          event.dataTransfer.setData(ITEM_DATA_TRANSFER_KEY, JSON.stringify(item));
        }}
        onDragEnd={(event) => {
          // setIsDragging(false);
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
      {false ? (
        <div style={{ height: 4 }} />
      ) : (
        <div
          className={clsx(styles.dividerWrapper)}
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
