import { PointerSortableListNative } from '@/components/pointer-sortable-list-native.comp';

export default function Home() {
  const items = [
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
      content: 'Scarlet Witch',
      children: [
        { id: '5-1', content: 'Chaos Magic' },
        { id: '5-2', content: 'Reality Manipulation' },
        { id: '5-3', content: 'Telekinesis' },
      ],
    },
    {
      id: '6',
      content: 'Thor',
      children: [
        { id: '6-1', content: 'Mjolnir' },
        { id: '6-2', content: 'Stormbreaker' },
        { id: '6-3', content: 'Lightning Powers' },
      ],
    },
    { id: '7', content: 'Hulk' },
    { id: '8', content: 'Captain Marvel' },
    { id: '9', content: 'Winter Soldier' },
    {
      id: '10',
      content: 'Dr Strange',
      children: [
        { id: '10-1', content: 'Time Stone' },
        { id: '10-2', content: 'Cloak of Levitation' },
        {
          id: '10-3',
          content: 'Mystic Arts',
          children: [
            { id: '10-3-1', content: 'Portal Creation' },
            { id: '10-3-2', content: 'Astral Projection' },
          ],
        },
      ],
    },
  ];

  return (
    <main className="flex justify-center items-center h-screen">
      <PointerSortableListNative initial={items} />
    </main>
  );
}
