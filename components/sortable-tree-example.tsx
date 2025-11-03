'use client';

import { TreeNode } from '@/app/utilities/build-tree-node';
import { buildColumnHelper } from '@/components/build-column-helper';
import { SortableTree } from '@/components/sortable-tree';
import { ColumnDef, Item } from '@/components/types';
import clsx from 'clsx';
import { useState } from 'react';

export function SortableTreeExample() {
  const [clickedItem, setClickedItem] = useState<Item | null>(null);

  const columnDefs = useColumnDefs(setClickedItem);

  return (
    <main className="flex justify-center items-center h-screen">
      <SortableTree
        initial={items}
        uniqueIdentifierKey="id"
        columns={columnDefs}
        draggableRowClassName={clsx('rounded', 'border-2', 'border-slate-500', 'bg-slate-700')}
      />

      <div className="w-64 ml-4">
        {clickedItem && (
          <>
            <button onClick={() => setClickedItem(null)}>Close</button>
            <br />
            Clicked on: <pre>{JSON.stringify(clickedItem, null, 2)}</pre>
          </>
        )}
      </div>
    </main>
  );
}

const columnHelper = buildColumnHelper<TreeNode<Item>>();

function useColumnDefs(onItemClick: (item: Item) => void) {
  return [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (context) => {
        const item = context.row.original;

        return (
          <div className={clsx('px-3', 'py-2', 'flex', 'items-center', 'gap-3')}>
            {item.children?.length ? (
              <button style={{ width: 16 }} onClick={context.row.toggleExpanded}>
                {context.row.isExpanded ? 'V' : '>'}
              </button>
            ) : (
              <div style={{ width: 16 }} />
            )}
            <button
              className={clsx('min-w-0', 'select-none', 'inline-block', 'text-left', 'cursor-pointer')}
              onClick={(event) => {
                event.preventDefault();
                onItemClick(item);
              }}
              onDrag={(event) => event.preventDefault()}
            >
              {item.name}
            </button>
            {context.row.isDragging && !!item.children?.length && (
              <span className="text-sm italic">({item.children?.length} items)</span>
            )}
          </div>
        );
      },
    }),
  ] as const satisfies ColumnDef<TreeNode<Item>, any>[];
}

const items: TreeNode<Item>[] = [
  {
    id: '1',
    name: 'Iron Man',
    children: [
      { id: '1-1', name: 'Mark I Armor' },
      { id: '1-2', name: 'Mark 50 Armor' },
      { id: '1-3', name: 'Arc Reactor' },
    ],
  },
  {
    id: '2',
    name: 'Captain America',
    children: [
      { id: '2-1', name: 'Vibranium Shield' },
      { id: '2-2', name: 'Super Soldier Serum' },
    ],
  },
  { id: '3', name: 'Black Widow' },
  { id: '4', name: 'Hawkeye' },
  {
    id: '5',
    name: 'Scarlet Witch',
    children: [
      { id: '5-1', name: 'Chaos Magic' },
      { id: '5-2', name: 'Reality Manipulation' },
      { id: '5-3', name: 'Telekinesis' },
    ],
  },
  {
    id: '6',
    name: 'Thor',
    children: [
      { id: '6-1', name: 'Mjolnir' },
      { id: '6-2', name: 'Stormbreaker' },
      { id: '6-3', name: 'Lightning Powers' },
    ],
  },
  { id: '7', name: 'Hulk' },
  { id: '8', name: 'Captain Marvel' },
  { id: '9', name: 'Winter Soldier' },
  {
    id: '10',
    name: 'Dr Strange',
    children: [
      { id: '10-1', name: 'Time Stone' },
      { id: '10-2', name: 'Cloak of Levitation' },
      {
        id: '10-3',
        name: 'Mystic Arts',
        children: [
          { id: '10-3-1', name: 'Portal Creation' },
          { id: '10-3-2', name: 'Astral Projection' },
        ],
      },
    ],
  },
];
