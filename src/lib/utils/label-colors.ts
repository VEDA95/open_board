// Fixed palette for board labels. Stored as the raw hex string on labels.color
// and rendered via inline background-color.
export const LABEL_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b'
] as const;

export const DEFAULT_LABEL_COLOR = LABEL_COLORS[5];
