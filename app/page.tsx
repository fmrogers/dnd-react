import { DraDropContainer } from "@/components/drag-drop-container.comp";

export default function Home() {
  const items = [
    { id: "1", content: "Iron Man" },
    { id: "2", content: "Captain America" },
    { id: "3", content: "Black Widow" },
    { id: "4", content: "Hawkeye" },
    { id: "5", content: "Scarlet Witch" },
    { id: "6", content: "Thor" },
    { id: "7", content: "Hulk" },
    { id: "8", content: "Captain Marvel" },
    { id: "9", content: "Winter Soldier" },
    { id: "10", content: "Dr Strange" },
  ];

  return (
    <main className="flex justify-center items-center h-screen">
      <DraDropContainer items={items} />
    </main>
  );
}
