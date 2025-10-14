import type { PointerDragState } from '@/components/dnd.types';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

interface UsePointerDragArgs<T> {
  items: T[];
  getId: (item: T) => string;
  itemRefs: RefObject<Record<string, HTMLElement | null>>;
  onReorder: (next: T[]) => void;
  activationDistance?: number;
}

export const usePointerDrag = <T>({
  items,
  getId,
  itemRefs,
  onReorder,
  activationDistance = 0,
}: UsePointerDragArgs<T>) => {
  const [drag, setDrag] = useState<PointerDragState>({ isDragging: false });
  const pendingRef = useRef<null | {
    id: string;
    originalIndex: number;
    origin: { x: number; y: number };
    rect: DOMRect;
  }>(null);

  const startDrag = useCallback(
    (id: string, event: PointerEvent) => {
      const originalIndex = items.findIndex((idx) => getId(idx) === id);
      if (originalIndex === -1) return;

      const element = itemRefs.current[id];
      if (!element) return;

      const rect = element.getBoundingClientRect();

      pendingRef.current = {
        id,
        originalIndex,
        origin: { x: event.clientX, y: event.clientY },
        rect,
      };

      window.addEventListener('pointermove', handleMove, { passive: false });
      window.addEventListener('pointerup', handleUp, { passive: false });
      window.addEventListener('keydown', handleKey, true);
    },
    [items, getId],
  );

  const activateIfNeeded = useCallback(
    (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (!pending) return;

      const dx = event.clientX - pending.origin.x;
      const dy = event.clientY - pending.origin.y;
      if (Math.abs(dx) < activationDistance && Math.abs(dy) < activationDistance) return;

      setDrag({
        isDragging: true,
        id: pending.id,
        originalIndex: pending.originalIndex,
        origin: pending.origin,
        delta: { x: dx, y: dy },
        rect: pending.rect,
        overBoundary: pending.originalIndex,
      });
      pendingRef.current = null;
    },
    [activationDistance],
  );

  const handleMove = useCallback(
    (event: PointerEvent) => {
      if (pendingRef.current) {
        activateIfNeeded(event);
        if (pendingRef.current) {
          return;
        }
      }

      setDrag((prev) => {
        if (!prev.isDragging) return prev;
        const newDelta = {
          x: event.clientX - prev.origin.x,
          y: event.clientY - prev.origin.y,
        };

        const pointerY = event.clientY;
        let boundary = items.length;

        for (let idx = 0; idx < items.length; idx++) {
          const node = itemRefs.current[getId(items[idx])];
          if (!node) continue;

          const rect = node.getBoundingClientRect();
          const middle = rect.top + rect.height / 2;

          if (pointerY < middle) {
            boundary = idx;
            break;
          }
        }

        if (boundary === prev.overBoundary && newDelta.x === prev.delta.x && newDelta.y === prev.delta.y) {
          return prev;
        }

        return { ...prev, delta: newDelta, overBoundary: boundary };
      });
      event.preventDefault();
    },
    [items, getId, itemRefs, activateIfNeeded],
  );

  const finish = useCallback(
    (cancel?: boolean) => {
      setDrag((prev) => {
        if (!prev.isDragging) return prev;

        if (!cancel) {
          const target = prev.overBoundary <= prev.originalIndex ? prev.overBoundary : prev.overBoundary - 1;
          if (target !== prev.originalIndex) {
            const next = [...items];
            const [moved] = next.splice(prev.originalIndex, 1);
            next.splice(target, 0, moved);
            onReorder(next);
          }
        }
        return { isDragging: false };
      });
    },
    [items, onReorder],
  );

  const handleUp = useCallback(() => {
    pendingRef.current = null;
    finish(false);
    detach();
  }, [finish]);

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        pendingRef.current = null;
        finish();
        detach();
      }
    },
    [finish],
  );

  const detach = () => {
    window.removeEventListener('pointermove', handleMove);
    window.removeEventListener('keydown', handleKey, true);
  };

  useEffect(() => {
    return () => {
      detach();
    };
  }, []);

  return {
    drag,
    beginPointerDrag: startDrag,
  };
};
