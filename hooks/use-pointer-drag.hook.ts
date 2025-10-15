import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export type PointerDragState =
  | { isDragging: false }
  | {
      isDragging: true;
      id: string;
      originalIndex: number;
      origin: { x: number; y: number };
      delta: { x: number; y: number };
      rect: DOMRect;
      overBoundary: number;
    };

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

  // Refs for dynamic dependencies to keep stable handler identities
  const itemsRef = useRef(items);
  const getIdRef = useRef(getId);
  const onReorderRef = useRef(onReorder);
  const activationDistanceRef = useRef(activationDistance);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    getIdRef.current = getId;
  }, [getId]);

  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  useEffect(() => {
    activationDistanceRef.current = activationDistance;
  }, [activationDistance]);

  const finishRef = useRef<((cancel?: boolean) => void) | null>(null);
  // Cache of item vertical midpoints (excluding source while dragging) to avoid repeated layout reads
  const midpointsRef = useRef<Array<{ index: number; middle: number }>>([]);

  const recomputeMidpoints = useCallback(() => {
    if (!drag.isDragging) {
      midpointsRef.current = [];
      return;
    }
    const currentItems = itemsRef.current;
    const getIdFn = getIdRef.current;
    const arr: Array<{ index: number; middle: number }> = [];
    for (let idx = 0; idx < currentItems.length; idx++) {
      const it = currentItems[idx];

      if (drag.id === getIdFn(it)) continue; // source removed from DOM

      const node = itemRefs.current[getIdFn(it)];
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      arr.push({ index: idx, middle: rect.top + rect.height / 2 });
    }
    midpointsRef.current = arr;
  }, [drag, itemRefs]);

  const finish = (cancel?: boolean) => {
    setDrag((prev) => {
      if (!prev.isDragging) return prev;
      if (!cancel) {
        const currentItems = itemsRef.current;
        const target = prev.overBoundary <= prev.originalIndex ? prev.overBoundary : prev.overBoundary - 1;

        if (target !== prev.originalIndex) {
          const next = [...currentItems];
          const [moved] = next.splice(prev.originalIndex, 1);
          next.splice(target, 0, moved);
          onReorderRef.current(next);
        }
      }
      return { isDragging: false };
    });
  };
  finishRef.current = finish;

  const handleMove = useCallback((event: PointerEvent) => {
    if (pendingRef.current) {
      const pending = pendingRef.current;
      const dx = event.clientX - pending.origin.x;
      const dy = event.clientY - pending.origin.y;
      if (Math.abs(dx) >= activationDistanceRef.current || Math.abs(dy) >= activationDistanceRef.current) {
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
        recomputeMidpoints();
      } else {
        event.preventDefault();
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
      let boundary = itemsRef.current.length;
      const cached = midpointsRef.current;
      for (let i = 0; i < cached.length; i++) {
        if (pointerY < cached[i].middle) {
          boundary = cached[i].index;
          break;
        }
      }
      if (boundary === prev.overBoundary && newDelta.x === prev.delta.x && newDelta.y === prev.delta.y) {
        return prev;
      }
      return { ...prev, delta: newDelta, overBoundary: boundary };
    });
    event.preventDefault();
  }, []);

  const detach = useCallback(() => {
    window.removeEventListener('pointermove', handleMove);
    window.removeEventListener('pointerup', handleUp);
    window.removeEventListener('keydown', handleKey, true);
  }, []);

  const handleUp = useCallback(
    (event: PointerEvent) => {
      pendingRef.current = null;
      finishRef.current?.(false);
      detach();
    },
    [detach],
  );

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        pendingRef.current = null;
        finishRef.current?.(true);
        detach();
      }
    },
    [detach],
  );

  // Re-attach detach dependencies now that handleUp/handleKey stable
  useEffect(() => {
    // update detach with stable handlers (noop body to ensure correct closure)
  }, []);

  const startDrag = useCallback(
    (id: string, event: PointerEvent) => {
      try {
        const sel = window.getSelection();
        if (sel && sel.toString().length > 0) {
          return;
        }
      } catch {}
      const currentItems = itemsRef.current;
      const getIdFn = getIdRef.current;
      const originalIndex = currentItems.findIndex((it) => getIdFn(it) === id);
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
      try {
        (event.target as HTMLElement)?.setPointerCapture?.(event.pointerId);
      } catch {}
      window.addEventListener('pointermove', handleMove, { passive: false });
      window.addEventListener('pointerup', handleUp, { passive: false });
      window.addEventListener('keydown', handleKey, true);
    },
    [handleMove, handleUp, handleKey, itemRefs],
  );

  useEffect(() => {
    return () => {
      detach();
    };
  }, [detach]);

  useEffect(() => {
    if (!drag.isDragging) return;
    const raf = requestAnimationFrame(() => recomputeMidpoints());
    return () => cancelAnimationFrame(raf);
  }, [drag, items, recomputeMidpoints]);

  return {
    drag,
    beginPointerDrag: startDrag,
  };
};
