// Fixed categorical palette for cluster ids. Mid-saturation/mid-lightness
// hex values chosen to read on both --bg-canvas tokens (#F0F0F0 light,
// #141414 dark) without per-theme variants.
export const CLUSTER_PALETTE = [
  '#6366F1', // indigo
  '#F59E0B', // amber
  '#10B981', // emerald
  '#EF4444', // red
  '#3B82F6', // blue
  '#EC4899', // pink
  '#84CC16', // lime
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#F97316', // orange
  '#14B8A6', // teal
  '#A855F7', // purple
]

export function colorForCluster(clusterId) {
  return CLUSTER_PALETTE[clusterId % CLUSTER_PALETTE.length]
}
