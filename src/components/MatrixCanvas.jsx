import { useEffect, useRef } from 'react'

export const CELL_W = 10
export const CELL_H = 8

const VIRIDIS = [
  [68, 1, 84],
  [72, 40, 120],
  [62, 74, 137],
  [49, 104, 142],
  [38, 130, 142],
  [31, 158, 137],
  [53, 183, 121],
  [110, 206, 88],
  [181, 222, 43],
  [253, 231, 37],
]

function viridisColor(t) {
  const clamped = Math.max(0, Math.min(1, t))
  const scaled = clamped * (VIRIDIS.length - 1)
  const lo = Math.floor(scaled)
  const hi = Math.min(lo + 1, VIRIDIS.length - 1)
  const frac = scaled - lo
  return [
    Math.round(VIRIDIS[lo][0] + frac * (VIRIDIS[hi][0] - VIRIDIS[lo][0])),
    Math.round(VIRIDIS[lo][1] + frac * (VIRIDIS[hi][1] - VIRIDIS[lo][1])),
    Math.round(VIRIDIS[lo][2] + frac * (VIRIDIS[hi][2] - VIRIDIS[lo][2])),
  ]
}

export function MatrixCanvas({ stoch, style }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !stoch) return
    const rows = stoch.length
    const cols = stoch[0]?.length ?? 0
    canvas.width = cols * CELL_W
    canvas.height = rows * CELL_H
    const ctx = canvas.getContext('2d')

    let min = Infinity, max = -Infinity
    for (const row of stoch) for (const v of row) {
      if (v < min) min = v
      if (v > max) max = v
    }
    const range = max - min || 1

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const [red, g, b] = viridisColor((stoch[r][c] - min) / range)
        ctx.fillStyle = `rgb(${red},${g},${b})`
        ctx.fillRect(c * CELL_W, r * CELL_H, CELL_W, CELL_H)
      }
    }
  }, [stoch])

  return (
    <canvas
      ref={ref}
      style={{ display: 'block', width: '100%', imageRendering: 'pixelated', borderRadius: 4, ...style }}
    />
  )
}
