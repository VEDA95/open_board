// Numeric-midpoint fractional positioning. New items append at the end with
// INITIAL_SPACING between them; moves take the midpoint of their neighbors.
// When repeated midpoints shrink a gap below MIN_GAP, the server renumbers
// the whole list (rebalance_card_positions / rebalance_list_positions).
export const INITIAL_SPACING = 1024;
export const MIN_GAP = 1e-6;

export function positionBetween(prev?: number | null, next?: number | null): number {
  if (prev == null && next == null) return INITIAL_SPACING;
  if (prev == null) return (next as number) / 2;
  if (next == null) return prev + INITIAL_SPACING;

  return (prev + next) / 2;
}

export function hasDegenerateGaps(positions: Array<number | null>): boolean {
  const sorted = positions
    .filter((position): position is number => position != null)
    .sort((a, b): number => a - b);

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] < MIN_GAP) return true;
  }

  return false;
}
