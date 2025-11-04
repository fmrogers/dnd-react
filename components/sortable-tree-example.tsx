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
      <SortableTree items={items} uniqueIdentifierKey="id" columns={columnDefs} stickyHeader />

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
    columnHelper.accessor('category', {
      header: 'Category',
      size: 120,
      cell: (context) => {
        if (context.row.isDragging) {
          return null;
        }
        return <div className={clsx('px-3', 'py-2', 'text-sm', 'text-gray-600')}>{context.getValue()}</div>;
      },
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      size: 300,
      cell: (context) => {
        const item = context.row.original;

        return (
          <div
            className={clsx('px-3', 'py-2', 'flex', 'items-center', 'gap-3')}
            style={{ marginLeft: context.row.childLevel * 16 }}
          >
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
    columnHelper.accessor('gems', {
      header: 'Gems',
      size: 80,
      cell: (context) => {
        if (context.row.isDragging) {
          return null;
        }
        return <div className={clsx('px-3', 'py-2', 'text-sm', 'font-mono', 'text-center')}>{context.getValue()}</div>;
      },
    }),
    columnHelper.accessor('mainSkill', {
      header: 'Main Skill',
      size: 200,
      cell: (context) => {
        if (context.row.isDragging) {
          return null;
        }
        return <div className={clsx('px-3', 'py-2', 'text-sm', 'text-blue-600')}>{context.getValue()}</div>;
      },
    }),
  ] as const satisfies ColumnDef<TreeNode<Item>, any>[];
}

const items: TreeNode<Item>[] = [
  {
    id: '1',
    name: 'Iron Man',
    category: 'Hero',
    gems: 85,
    mainSkill: 'Engineering',
    children: [
      { id: '1-1', name: 'Mark I Armor', category: 'Equipment', gems: 45, mainSkill: 'Protection' },
      { id: '1-2', name: 'Mark 50 Armor', category: 'Equipment', gems: 92, mainSkill: 'Advanced Combat' },
      { id: '1-3', name: 'Arc Reactor', category: 'Technology', gems: 78, mainSkill: 'Energy Generation' },
    ],
  },
  {
    id: '2',
    name: 'Captain America',
    category: 'Hero',
    gems: 73,
    mainSkill: 'Leadership',
    children: [
      { id: '2-1', name: 'Vibranium Shield', category: 'Weapon', gems: 88, mainSkill: 'Defense' },
      { id: '2-2', name: 'Super Soldier Serum', category: 'Enhancement', gems: 95, mainSkill: 'Physical Enhancement' },
    ],
  },
  { id: '3', name: 'Black Widow', category: 'Hero', gems: 67, mainSkill: 'Espionage' },
  { id: '4', name: 'Hawkeye', category: 'Hero', gems: 71, mainSkill: 'Archery' },
  {
    id: '5',
    name: 'Scarlet Witch',
    category: 'Hero',
    gems: 94,
    mainSkill: 'Reality Manipulation',
    children: [
      { id: '5-1', name: 'Chaos Magic', category: 'Power', gems: 89, mainSkill: 'Chaos Control' },
      { id: '5-2', name: 'Reality Manipulation', category: 'Power', gems: 96, mainSkill: 'Reality Alteration' },
      { id: '5-3', name: 'Telekinesis', category: 'Power', gems: 82, mainSkill: 'Mind Control' },
    ],
  },
  {
    id: '6',
    name: 'Thor',
    category: 'God',
    gems: 91,
    mainSkill: 'Thunder Control',
    children: [
      { id: '6-1', name: 'Mjolnir', category: 'Weapon', gems: 99, mainSkill: 'Lightning Strike' },
      { id: '6-2', name: 'Stormbreaker', category: 'Weapon', gems: 97, mainSkill: 'Dimensional Cut' },
      { id: '6-3', name: 'Lightning Powers', category: 'Power', gems: 93, mainSkill: 'Weather Control' },
    ],
  },
  { id: '7', name: 'Hulk', category: 'Hero', gems: 79, mainSkill: 'Strength' },
  { id: '8', name: 'Captain Marvel', category: 'Hero', gems: 87, mainSkill: 'Energy Projection' },
  { id: '9', name: 'Winter Soldier', category: 'Anti-Hero', gems: 69, mainSkill: 'Tactical Combat' },
  {
    id: '10',
    name: 'Dr Strange',
    category: 'Sorcerer',
    gems: 98,
    mainSkill: 'Mystic Arts',
    children: [
      { id: '10-1', name: 'Time Stone', category: 'Artifact', gems: 100, mainSkill: 'Time Manipulation' },
      { id: '10-2', name: 'Cloak of Levitation', category: 'Equipment', gems: 75, mainSkill: 'Flight' },
      {
        id: '10-3',
        name: 'Mystic Arts',
        category: 'Magic',
        gems: 90,
        mainSkill: 'Spell Casting',
        children: [
          { id: '10-3-1', name: 'Portal Creation', category: 'Spell', gems: 84, mainSkill: 'Dimensional Travel' },
          { id: '10-3-2', name: 'Astral Projection', category: 'Spell', gems: 77, mainSkill: 'Spirit Form' },
        ],
      },
    ],
  },
];
