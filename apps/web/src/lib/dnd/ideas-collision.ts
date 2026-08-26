import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core";

/**
 * Collision detection for the Ideas kanban, mirroring `taskPriorityCollision`
 * used by the Board tab.
 *
 * `closestCorners` (the previous strategy) ranks the column and its cards in
 * one flat list, so near the bottom of a list the column's corner often wins
 * over the card the pointer is actually on — the drop then lands a slot short.
 * Here the pointer picks the column first, then a card *within that column*,
 * and falls back to the column itself for the empty space below the last card
 * (which is what makes "drop at the end" work).
 */
export const ideaPriorityCollision: CollisionDetection = (args) => {
  const { droppableContainers, active } = args;

  const columns = droppableContainers.filter(
    (c) => c.data.current?.type === "column"
  );
  const cards = droppableContainers.filter(
    (c) => c.data.current?.type === "idea"
  );

  // Dragging a whole column — only columns are valid targets.
  if (active.data.current?.type === "column") {
    const hits = pointerWithin({ ...args, droppableContainers: columns });
    return hits.length > 0
      ? hits
      : closestCenter({ ...args, droppableContainers: columns });
  }

  const columnHits = pointerWithin({ ...args, droppableContainers: columns });
  if (columnHits.length === 0) {
    // Outside every column (e.g. over the board gutter) — fall back to cards.
    return rectIntersection({ ...args, droppableContainers: cards });
  }

  const targetColumnId = columnHits[0]!.id;
  const cardsInColumn = cards.filter(
    (c) => c.data.current?.columnId === targetColumnId
  );

  if (cardsInColumn.length > 0) {
    const cardHits = pointerWithin({
      ...args,
      droppableContainers: cardsInColumn,
    });
    if (cardHits.length > 0) return cardHits;
  }

  return columnHits;
};
