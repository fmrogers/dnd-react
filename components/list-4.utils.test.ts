import { describe, expect, it } from 'vitest';
import { moveItemAsChild, placeItemsBeforeTarget } from './list-4.utils';

interface TestItem {
  id: string;
  content: string;
  children?: TestItem[];
}

describe('placeItemsBeforeTarget', () => {
  const createTestData = (): TestItem[] => [
    {
      id: '1',
      content: 'Iron Man',
      children: [
        { id: '1-1', content: 'Mark I Armor' },
        { id: '1-2', content: 'Mark 50 Armor' },
        { id: '1-3', content: 'Arc Reactor' },
      ],
    },
    {
      id: '2',
      content: 'Captain America',
      children: [
        { id: '2-1', content: 'Vibranium Shield' },
        { id: '2-2', content: 'Super Soldier Serum' },
      ],
    },
    { id: '3', content: 'Black Widow' },
    { id: '4', content: 'Hawkeye' },
    {
      id: '5',
      content: 'Thor',
      children: [
        { id: '5-1', content: 'Mjolnir' },
        { id: '5-2', content: 'Stormbreaker' },
      ],
    },
  ];

  describe('Root level operations', () => {
    it('should move item from position 0 to position 2 (after Black Widow)', () => {
      const items = createTestData();

      // Drag Iron Man (1) and drop it after Black Widow (3)
      const result = placeItemsBeforeTarget(
        items,
        'id',
        ['1'], // Iron Man's path
        ['3'], // Drop after Black Widow
      );

      expect(result).toHaveLength(5);
      expect(result[0].id).toBe('2'); // Captain America
      expect(result[1].id).toBe('3'); // Black Widow
      expect(result[2].id).toBe('1'); // Iron Man (moved here)
      expect(result[3].id).toBe('4'); // Hawkeye
      expect(result[4].id).toBe('5'); // Thor
    });

    it('should move item from end to beginning', () => {
      const items = createTestData();

      // Drag Thor (5) and drop it after Iron Man (1)
      const result = placeItemsBeforeTarget(
        items,
        'id',
        ['5'], // Thor's path
        ['1'], // Drop after Iron Man
      );

      expect(result).toHaveLength(5);
      expect(result[0].id).toBe('1'); // Iron Man
      expect(result[1].id).toBe('5'); // Thor (moved here)
      expect(result[2].id).toBe('2'); // Captain America
      expect(result[3].id).toBe('3'); // Black Widow
      expect(result[4].id).toBe('4'); // Hawkeye
    });

    it('should handle moving item to the very end', () => {
      const items = createTestData();

      // Drag Iron Man (1) and drop it after Thor (5) - should be at the end
      const result = placeItemsBeforeTarget(
        items,
        'id',
        ['1'], // Iron Man's path
        ['5'], // Drop after Thor
      );

      expect(result).toHaveLength(5);
      expect(result[0].id).toBe('2'); // Captain America
      expect(result[1].id).toBe('3'); // Black Widow
      expect(result[2].id).toBe('4'); // Hawkeye
      expect(result[3].id).toBe('5'); // Thor
      expect(result[4].id).toBe('1'); // Iron Man (moved to end)
    });
  });

  describe('Child level operations', () => {
    it('should move child item within same parent', () => {
      const items = createTestData();

      // Move Mark I Armor after Arc Reactor within Iron Man's children
      const result = placeItemsBeforeTarget(
        items,
        'id',
        ['1', '1-1'], // Mark I Armor path
        ['1', '1-3'], // Drop after Arc Reactor
      );

      const ironMan = result.find((item) => item.id === '1');
      expect(ironMan?.children).toHaveLength(3);
      expect(ironMan?.children?.[0].id).toBe('1-2'); // Mark 50 Armor
      expect(ironMan?.children?.[1].id).toBe('1-3'); // Arc Reactor
      expect(ironMan?.children?.[2].id).toBe('1-1'); // Mark I Armor (moved here)
    });

    it('should move child from one parent to another parent', () => {
      const items = createTestData();

      // Move Mark I Armor from Iron Man to Captain America (after Vibranium Shield)
      const result = placeItemsBeforeTarget(
        items,
        'id',
        ['1', '1-1'], // Mark I Armor path (from Iron Man)
        ['2', '2-1'], // Drop after Vibranium Shield (in Captain America)
      );

      // Check Iron Man's children (should have one less)
      const ironMan = result.find((item) => item.id === '1');
      expect(ironMan?.children).toHaveLength(2);
      expect(ironMan?.children?.some((child) => child.id === '1-1')).toBe(false);

      // Check Captain America's children (should have one more)
      const captainAmerica = result.find((item) => item.id === '2');
      expect(captainAmerica?.children).toHaveLength(3);
      expect(captainAmerica?.children?.[0].id).toBe('2-1'); // Vibranium Shield
      expect(captainAmerica?.children?.[1].id).toBe('1-1'); // Mark I Armor (moved here)
      expect(captainAmerica?.children?.[2].id).toBe('2-2'); // Super Soldier Serum
    });

    it('should move child to beginning of another parent', () => {
      const items = createTestData();

      // Move Arc Reactor from Iron Man to beginning of Thor's children (after no item, so before Mjolnir)
      const result = placeItemsBeforeTarget(
        items,
        'id',
        ['1', '1-3'], // Arc Reactor path
        ['5', '5-1'], // Drop after Mjolnir in Thor
      );

      const thor = result.find((item) => item.id === '5');
      expect(thor?.children).toHaveLength(3);
      expect(thor?.children?.[0].id).toBe('5-1'); // Mjolnir
      expect(thor?.children?.[1].id).toBe('1-3'); // Arc Reactor (moved here)
      expect(thor?.children?.[2].id).toBe('5-2'); // Stormbreaker
    });
  });

  describe('Error handling', () => {
    it('should return original items when dragged item is not found', () => {
      const items = createTestData();

      const result = placeItemsBeforeTarget(
        items,
        'id',
        ['non-existent'], // Invalid dragged item
        ['1'],
      );

      expect(result).toEqual(items);
    });

    it('should throw error when target item is not found', () => {
      const items = createTestData();

      expect(() => {
        placeItemsBeforeTarget(
          items,
          'id',
          ['1'], // Valid dragged item
          ['non-existent'], // Invalid target
        );
      }).toThrow('Cannot find dropped-on item with id non-existent');
    });

    it('should throw error when child dragged item path is invalid', () => {
      const items = createTestData();

      expect(() => {
        placeItemsBeforeTarget(
          items,
          'id',
          ['1', 'non-existent'], // Invalid child path
          ['2'],
        );
      }).toThrow('Cannot find dragged item with id non-existent');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty children arrays', () => {
      const items: TestItem[] = [
        { id: '1', content: 'Item 1', children: [] },
        { id: '2', content: 'Item 2' },
      ];

      const result = placeItemsBeforeTarget(items, 'id', ['2'], ['1']);

      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should preserve item structure and content', () => {
      const items = createTestData();

      const result = placeItemsBeforeTarget(items, 'id', ['1'], ['3']);

      const movedIronMan = result.find((item) => item.id === '1');
      expect(movedIronMan?.content).toBe('Iron Man');
      expect(movedIronMan?.children).toHaveLength(3);
      expect(movedIronMan?.children?.[0].content).toBe('Mark I Armor');
    });

    it('should handle single item list', () => {
      const items: TestItem[] = [{ id: '1', content: 'Only Item' }];

      // This should essentially be a no-op since there's nowhere to move
      const result = placeItemsBeforeTarget(
        items,
        'id',
        ['1'],
        ['1'], // Drop after itself
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('Complex nested scenarios', () => {
    it('should handle moving between deeply nested structures', () => {
      const complexItems: TestItem[] = [
        {
          id: '1',
          content: 'Parent 1',
          children: [
            {
              id: '1-1',
              content: 'Child 1-1',
              children: [
                { id: '1-1-1', content: 'Grandchild 1-1-1' },
                { id: '1-1-2', content: 'Grandchild 1-1-2' },
              ],
            },
          ],
        },
        {
          id: '2',
          content: 'Parent 2',
          children: [{ id: '2-1', content: 'Child 2-1' }],
        },
      ];

      const result = placeItemsBeforeTarget(
        complexItems,
        'id',
        ['1', '1-1', '1-1-1'], // Move grandchild
        ['2', '2-1'], // After Child 2-1
      );

      const parent2 = result.find((item) => item.id === '2');
      expect(parent2?.children).toHaveLength(2);
      expect(parent2?.children?.[1].id).toBe('1-1-1');
      expect(parent2?.children?.[1].content).toBe('Grandchild 1-1-1');
    });
  });
});

describe('moveItemAsChild', () => {
  const createTestData = (): TestItem[] => [
    {
      id: '1',
      content: 'Iron Man',
      children: [
        { id: '1-1', content: 'Mark I Armor' },
        { id: '1-2', content: 'Mark 50 Armor' },
        { id: '1-3', content: 'Arc Reactor' },
      ],
    },
    {
      id: '2',
      content: 'Captain America',
      children: [
        { id: '2-1', content: 'Vibranium Shield' },
        { id: '2-2', content: 'Super Soldier Serum' },
      ],
    },
    { id: '3', content: 'Black Widow' },
    { id: '4', content: 'Hawkeye' },
    {
      id: '5',
      content: 'Thor',
      children: [
        { id: '5-1', content: 'Mjolnir' },
        { id: '5-2', content: 'Stormbreaker' },
      ],
    },
  ];

  describe('Basic functionality', () => {
    it('should move root item as child of another root item', () => {
      const items = createTestData();

      // Move Black Widow to become a child of Thor
      const result = moveItemAsChild(
        items,
        'id',
        ['3'], // Black Widow's path
        ['5'], // Thor's path
      );

      expect(result).toHaveLength(4); // One less root item
      expect(result.some((item) => item.id === '3')).toBe(false); // Black Widow not at root

      const thor = result.find((item) => item.id === '5');
      expect(thor?.children).toHaveLength(3);
      expect(thor?.children?.[2].id).toBe('3'); // Black Widow added as last child
      expect(thor?.children?.[2].content).toBe('Black Widow');
    });

    it('should move root item as child of item that has no children', () => {
      const items = createTestData();

      // Move Hawkeye to become a child of Black Widow (who has no children)
      const result = moveItemAsChild(
        items,
        'id',
        ['4'], // Hawkeye's path
        ['3'], // Black Widow's path
      );

      expect(result).toHaveLength(4); // One less root item

      const blackWidow = result.find((item) => item.id === '3');
      expect(blackWidow?.children).toHaveLength(1);
      expect(blackWidow?.children?.[0].id).toBe('4'); // Hawkeye is now child
      expect(blackWidow?.children?.[0].content).toBe('Hawkeye');
    });

    it('should move child item to become child of another parent', () => {
      const items = createTestData();

      // Move Mark I Armor from Iron Man to Captain America
      const result = moveItemAsChild(
        items,
        'id',
        ['1', '1-1'], // Mark I Armor's path
        ['2'], // Captain America's path
      );

      // Iron Man should have one less child
      const ironMan = result.find((item) => item.id === '1');
      expect(ironMan?.children).toHaveLength(2);
      expect(ironMan?.children?.some((child) => child.id === '1-1')).toBe(false);

      // Captain America should have one more child
      const captainAmerica = result.find((item) => item.id === '2');
      expect(captainAmerica?.children).toHaveLength(3);
      expect(captainAmerica?.children?.[2].id).toBe('1-1'); // Mark I Armor added
      expect(captainAmerica?.children?.[2].content).toBe('Mark I Armor');
    });

    it('should move child to become child of sibling', () => {
      const items = createTestData();

      // Move Arc Reactor to become child of Mark I Armor
      const result = moveItemAsChild(
        items,
        'id',
        ['1', '1-3'], // Arc Reactor's path
        ['1', '1-1'], // Mark I Armor's path
      );

      const ironMan = result.find((item) => item.id === '1');
      expect(ironMan?.children).toHaveLength(2); // One less direct child

      const markIArmor = ironMan?.children?.find((child) => child.id === '1-1');
      expect(markIArmor?.children).toHaveLength(1);
      expect(markIArmor?.children?.[0].id).toBe('1-3'); // Arc Reactor is now child of Mark I
    });
  });

  describe('Edge cases and error handling', () => {
    it('should return original items when trying to drop item on itself', () => {
      const items = createTestData();

      const result = moveItemAsChild(
        items,
        'id',
        ['1'], // Iron Man
        ['1'], // Drop on Iron Man itself
      );

      expect(result).toEqual(items); // Should be unchanged
    });

    it('should return original items when dragged item is not found at root level', () => {
      const items = createTestData();

      const result = moveItemAsChild(
        items,
        'id',
        ['non-existent'], // Invalid dragged item
        ['1'],
      );

      expect(result).toEqual(items);
    });

    it('should throw error when dragged child item is not found', () => {
      const items = createTestData();

      expect(() => {
        moveItemAsChild(
          items,
          'id',
          ['1', 'non-existent'], // Invalid child path
          ['2'],
        );
      }).toThrow('Cannot find dragged item with id non-existent');
    });

    it('should throw error when target item is not found', () => {
      const items = createTestData();

      expect(() => {
        moveItemAsChild(
          items,
          'id',
          ['1'], // Valid dragged item
          ['non-existent'], // Invalid target
        );
      }).toThrow('Cannot find target item with id non-existent');
    });

    it('should throw error when would create circular dependency', () => {
      const items = createTestData();

      expect(() => {
        moveItemAsChild(
          items,
          'id',
          ['1'], // Iron Man
          ['1', '1-1'], // Mark I Armor (child of Iron Man)
        );
      }).toThrow('Cannot move item: would create circular dependency');
    });

    it('should handle empty children arrays', () => {
      const items: TestItem[] = [
        { id: '1', content: 'Item 1', children: [] },
        { id: '2', content: 'Item 2' },
      ];

      const result = moveItemAsChild(items, 'id', ['2'], ['1']);

      expect(result).toHaveLength(1);
      const item1 = result[0];
      expect(item1.children).toHaveLength(1);
      expect(item1.children?.[0].id).toBe('2');
    });

    it('should preserve item structure and content', () => {
      const items = createTestData();

      const result = moveItemAsChild(items, 'id', ['1'], ['3']);

      const blackWidow = result.find((item) => item.id === '3');
      const movedIronMan = blackWidow?.children?.[0];

      expect(movedIronMan?.content).toBe('Iron Man');
      expect(movedIronMan?.children).toHaveLength(3); // All Iron Man's children preserved
      expect(movedIronMan?.children?.[0].content).toBe('Mark I Armor');
    });
  });

  describe('Complex nested scenarios', () => {
    it('should handle moving between deeply nested structures', () => {
      const complexItems: TestItem[] = [
        {
          id: '1',
          content: 'Parent 1',
          children: [
            {
              id: '1-1',
              content: 'Child 1-1',
              children: [
                { id: '1-1-1', content: 'Grandchild 1-1-1' },
                { id: '1-1-2', content: 'Grandchild 1-1-2' },
              ],
            },
          ],
        },
        {
          id: '2',
          content: 'Parent 2',
          children: [
            {
              id: '2-1',
              content: 'Child 2-1',
              children: [{ id: '2-1-1', content: 'Grandchild 2-1-1' }],
            },
          ],
        },
      ];

      // Move grandchild from one deep nest to another
      const result = moveItemAsChild(
        complexItems,
        'id',
        ['1', '1-1', '1-1-1'], // Grandchild 1-1-1
        ['2', '2-1'], // Child 2-1
      );

      // Original location should have one less grandchild
      const parent1 = result.find((item) => item.id === '1');
      const child11 = parent1?.children?.[0];
      expect(child11?.children).toHaveLength(1);
      expect(child11?.children?.[0].id).toBe('1-1-2');

      // Target location should have one more grandchild
      const parent2 = result.find((item) => item.id === '2');
      const child21 = parent2?.children?.[0];
      expect(child21?.children).toHaveLength(2);
      expect(child21?.children?.[1].id).toBe('1-1-1');
      expect(child21?.children?.[1].content).toBe('Grandchild 1-1-1');
    });

    it('should prevent circular dependency in complex structures', () => {
      const complexItems: TestItem[] = [
        {
          id: '1',
          content: 'Parent 1',
          children: [
            {
              id: '1-1',
              content: 'Child 1-1',
              children: [{ id: '1-1-1', content: 'Grandchild 1-1-1' }],
            },
          ],
        },
      ];

      expect(() => {
        moveItemAsChild(
          complexItems,
          'id',
          ['1', '1-1'], // Child 1-1
          ['1', '1-1', '1-1-1'], // Its own grandchild
        );
      }).toThrow('Cannot move item: would create circular dependency');
    });
  });
});
