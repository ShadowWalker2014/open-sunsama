/**
 * Side-by-side overlap layout for calendar items.
 *
 * Solves the classic "Google Calendar problem": when N events overlap at
 * the same time, they should split the available column width into N
 * sub-columns rather than stacking on top of each other.
 *
 * The algorithm is the standard interval-graph greedy column packer:
 *
 *   1. Sort items by start time, with the longer event first as a
 *      tiebreaker so the wider time-slot owners get the leftmost lane.
 *   2. Walk items in order. For each one, assign it to the lowest-index
 *      "lane" (column) that doesn't conflict in time with any other
 *      item already placed in that lane.
 *   3. Group items into "clusters" — chains where every member overlaps
 *      with at least one other in the chain. Within a cluster, every
 *      item shares the same `columnCount` (= the maximum number of
 *      lanes used at any point in the cluster).
 *
 * The rendered position is then:
 *   left  = (lane / columnCount) * 100%
 *   width = (1 / columnCount) * 100%
 *
 * This component-level utility is intentionally narrow: it accepts a
 * minimal `LayoutItem` shape (id, start, end) so both `CalendarEvent`
 * and `TimeBlock` can be packed together — they visually compete for
 * the same column real estate.
 */

export interface LayoutItem {
  id: string;
  start: Date;
  end: Date;
}

export interface LayoutResult {
  /** Zero-based lane index within the cluster. */
  lane: number;
  /** Total lanes used by the cluster this item belongs to. */
  columnCount: number;
}

/**
 * Compute layout positions for a list of overlapping items. Returns a
 * Map from item id → { lane, columnCount } so callers can look up
 * positioning info without re-iterating the input order.
 *
 * Items that don't overlap with anything get { lane: 0, columnCount: 1 }
 * and so render at full width.
 */
export function layoutOverlappingItems(
  items: LayoutItem[]
): Map<string, LayoutResult> {
  const result = new Map<string, LayoutResult>();
  if (items.length === 0) return result;

  // Sort by start time, longer-first as tiebreaker. Longer events first
  // means a 2-hour 9am event keeps the leftmost lane against a 30-min
  // 9am event — matches Google Calendar's visual grouping.
  const sorted = [...items].sort((a, b) => {
    const startDiff = a.start.getTime() - b.start.getTime();
    if (startDiff !== 0) return startDiff;
    return b.end.getTime() - a.end.getTime();
  });

  // A "cluster" is a contiguous group of items where every member
  // overlaps with at least one other member. Items in a cluster share
  // a column count.
  let cluster: LayoutItem[] = [];
  let clusterEnd = -Infinity; // The latest end time seen in the cluster

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const placements = packCluster(cluster);
    const columnCount = Math.max(
      1,
      ...placements.map((p) => p.lane + 1)
    );
    for (const p of placements) {
      result.set(p.id, { lane: p.lane, columnCount });
    }
    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const item of sorted) {
    if (item.start.getTime() >= clusterEnd) {
      // No overlap with the current cluster — start a fresh one.
      flushCluster();
    }
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end.getTime());
  }
  flushCluster();

  return result;
}

/**
 * Pack a single cluster of overlapping items into lanes. Each item is
 * placed in the lowest-index lane whose tail (last placed item's end)
 * is ≤ the new item's start.
 */
function packCluster(
  items: LayoutItem[]
): Array<{ id: string; lane: number }> {
  // laneEnds[i] = the end-time of the latest item assigned to lane i.
  const laneEnds: number[] = [];
  const placements: Array<{ id: string; lane: number }> = [];

  for (const item of items) {
    const startMs = item.start.getTime();
    let lane = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i]! <= startMs) {
        lane = i;
        break;
      }
    }
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.end.getTime());
    } else {
      laneEnds[lane] = item.end.getTime();
    }
    placements.push({ id: item.id, lane });
  }

  return placements;
}
