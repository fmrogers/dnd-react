# Sortable Drag & Drop Implementation Plan

This document tracks each incremental step for adding sortable (reorder) logic to the existing custom drag & drop system. You trigger each step manually ("Proceed with Step X") so progress stays clear and controlled.

---

## Overview

We already have:

- Native HTML5 drag events
- Custom floating preview via `DraggableItemPreview` (portal)
- Items rendered by `DragDropContainer` + `DraggableItem`

We will layer sortable (list reordering) behavior **without introducing a library**, keeping the preview intact.

---

## State We Will Introduce

| Name            | Type                                 | Purpose                                                                     |
| --------------- | ------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------- |
| `draggingId`    | `string \| null`                     | Which item is currently being dragged                                       |
| `originalIndex` | `number \| null`                     | Index where the drag started (for reorder computation)                      |
| `over`          | `{ index: number; position: 'before' | 'after' } \| null`                                                          | Current hover target + relative insertion side |
| `items`         | existing source                      | Underlying list to reorder (may be lifted to state if currently props-only) |

Derived (not always stored):

- `insertionIndex` (computed from `originalIndex` + `over`)

---

## Reorder Helper (will be added in Step 5)

```ts
function reorder<T>(list: T[], from: number, to: number): T[] {
  if (from === to) return list;
  const copy = [...list];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}
```

---

## Step-by-Step Execution

Check off each step once implemented.

### Step 1 – Add Sortable State Scaffolding

- Add `draggingId`, `originalIndex`, `over` state to `DragDropContainer`.
- Do **not** change visuals yet.
- Existing drag preview still functions.

**Exit Criteria:** App runs with new state added (no behavior changes).

### Step 2 – Enhance `onDragStart`

- When an item starts dragging, set `draggingId` + `originalIndex`.
- Keep existing `dragState` for the preview if still used.
- Do **not** hide item differently yet (we'll decide after Step 3 whether to use `visibility: hidden`).

**Exit Criteria:** Dragging updates new state fields; no errors.

### Step 3 – Implement `onDragOver` Hover Logic

- Add `onDragOver` handler to each rendered item.
- Compute midpoint of hovered item: `rect.top + rect.height / 2`.
- Compare pointer `clientY` to midpoint → set `over = { index, position: 'before' | 'after' }`.
- Always call `event.preventDefault()` so drop is allowed.

**Exit Criteria:** While dragging, internal `over` state updates as you move between items; still no visual indicators.

### Step 4 – Render Insertion Indicator (Line)

- Conditionally render a thin horizontal line (2px) at top (before) or bottom (after) of the hovered item.
- Use absolutely positioned element inside item container.
- Optionally smooth with a small transition.

**Exit Criteria:** Clear visual line shows intended insertion point while dragging.

### Step 5 – Apply Reorder on Drop

- On `drop` (or `dragEnd` fallback), compute `targetIndex` using:
  ```txt
  if position === 'before':
    target = hoverIndex > originalIndex ? hoverIndex - 1 : hoverIndex
  else (after):
    target = hoverIndex > originalIndex ? hoverIndex : hoverIndex + 1
  ```
- Clamp index to `[0, items.length - 1]`.
- Use `reorder()` helper to build next list.
- Update items (lift to state if necessary).

**Exit Criteria:** Dropping an item reorders the list correctly.

### Step 6 – Robust Cleanup

- Ensure `draggingId`, `originalIndex`, `over` reset on:
  - Successful drop
  - Drag canceled / `dragend`
  - ESC (optional later)
- Ensure preview disappears cleanly.

**Exit Criteria:** No stale state after any drag cycle.

### Step 7 – Polishing & Edge Cases

- Handle dropping below last item (if hovering below bottom region → treat as `after` last index).
- Fade opacity / animate gap (optional).
- Keyboard accessibility (optional future: arrow key reorder + space to pick up / drop).
- Guard against reordering when `over` is `null`.

**Exit Criteria:** UX feels solid; no flicker; no accidental no-ops unless intentionally dropped in original spot.

### Step 8 – (Optional Variant) Placeholder Block

- Instead of a line, render a spacer element representing final space.
- Requires deriving a temporary render list with a phantom placeholder.
- Can combine with subtle animation.

**Exit Criteria:** Placeholder version working as an alternative.

---

## Edge Cases Checklist

| Case                             | Covered Step | Notes                                     |
| -------------------------------- | ------------ | ----------------------------------------- |
| Drag over itself                 | Step 3/5     | Should not reorder if net index unchanged |
| Drop without hovering any item   | Step 5       | No-op; just cleanup                       |
| Very fast drag leaving container | Step 6       | Ensure cleanup on dragend                 |
| Drop after last item             | Step 7       | Needs explicit detection                  |
| Duplicate IDs (avoid)            | N/A          | IDs must be unique                        |

---

## Debug Tips

- Temporarily log: `draggingId`, `originalIndex`, `over`, and computed `targetIndex`.
- Add a dev panel showing live state while validating reorder math.
- If `dragend` not firing, verify dragged element isn't unmounted prematurely.

---

## Optional Enhancements (Later)

- Auto-scroll container when dragging near edges.
- Spring animations (Framer Motion) for items shifting.
- Multi-select drag (shift + click groups).
- Persist order to backend or localStorage.
- Touch support (pointer events fallback) if you need mobile.

---

## Commands (Optional Helpers)

To view current diff while iterating:

```bash
git diff --name-only
git diff components/drag-drop-container.comp.tsx
```

---

## How To Proceed

When ready, say: **"Proceed with Step 1"**.
I’ll implement only that step and stop for review.

---

_Reference maintained in `SORTABLE_PLAN.md`. You can edit notes inline as we progress._
