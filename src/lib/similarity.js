// Mirrors her-dream/rewards.py's row_by_row_reward: per-row exact-match
// breakdown between two (S, K) one-hot stoch matrices.
export function rowMatches(stochA, stochB) {
  if (!stochA || !stochB || stochA.length !== stochB.length) return []
  return stochA.map((rowA, r) => {
    const rowB = stochB[r]
    if (rowA.length !== rowB.length) return false
    return rowA.every((v, c) => v === rowB[c])
  })
}

// Fraction of rows that match exactly (matches / S).
export function rowMatchSimilarity(stochA, stochB) {
  const matches = rowMatches(stochA, stochB)
  if (matches.length === 0) return 0
  return matches.filter(Boolean).length / matches.length
}

// Index of the hot category in a one-hot row.
export function argmaxIndex(row) {
  let best = 0
  for (let i = 1; i < row.length; i++) if (row[i] > row[best]) best = i
  return best
}
