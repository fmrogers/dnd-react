import { useRef, type DragEvent } from "react";

export const useDragClone = <T extends HTMLElement = HTMLDivElement>() => {
  const elementRef = useRef<T>(null);

  const createDragClone = (event: DragEvent<T>) => {
    if (!elementRef.current) return;

    const clone = elementRef.current.cloneNode(true) as HTMLElement;

    clone.style.position = "absolute";
    clone.style.top = "-1000px";
    clone.style.left = "-1000px";
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "-1";

    clone.style.opacity = "1 !important";
    clone.style.filter = "none !important";
    clone.style.transform = "none !important";
    clone.style.background = "solid !important";

    const allElements = [
      clone,
      ...clone.querySelectorAll("*"),
    ] as HTMLElement[];
    allElements.forEach((el) => {
      el.style.opacity = "1";
      el.style.filter = "none";
      el.style.backdropFilter = "none";
      el.style.background = getComputedStyle(el).backgroundColor || "inherit";
    });

    document.body.appendChild(clone);

    const rect = elementRef.current.getBoundingClientRect();
    event.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2);

    setTimeout(() => {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }, 0);
  };

  return {
    elementRef,
    createDragClone,
  };
};
