import { useEffect, useRef, useCallback } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'

const CELL_W = 8
const CELL_H = 6

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
  const r = Math.round(VIRIDIS[lo][0] + frac * (VIRIDIS[hi][0] - VIRIDIS[lo][0]))
  const g = Math.round(VIRIDIS[lo][1] + frac * (VIRIDIS[hi][1] - VIRIDIS[lo][1]))
  const b = Math.round(VIRIDIS[lo][2] + frac * (VIRIDIS[hi][2] - VIRIDIS[lo][2]))
  return [r, g, b]
}

const MODE_CYCLE = ['image', 'matrix', 'both']

function CycleIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="4" height="4" rx="0.75"/>
      <rect x="6" y="0" width="4" height="4" rx="0.75"/>
      <rect x="0" y="6" width="4" height="4" rx="0.75"/>
      <rect x="6" y="6" width="4" height="4" rx="0.75"/>
    </svg>
  )
}

export function StateNode({ id, data }) {
  const canvasRef = useRef(null)
  const { setNodes } = useReactFlow()

  const { stoch, image_b64, is_first, mode } = data

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !stoch) return

    const rows = stoch.length
    const cols = stoch[0]?.length ?? 0
    canvas.width = cols * CELL_W
    canvas.height = rows * CELL_H

    const ctx = canvas.getContext('2d')
    let min = Infinity
    let max = -Infinity
    for (const row of stoch) {
      for (const v of row) {
        if (v < min) min = v
        if (v > max) max = v
      }
    }
    const range = max - min || 1

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const t = (stoch[r][c] - min) / range
        const [red, green, blue] = viridisColor(t)
        ctx.fillStyle = `rgb(${red},${green},${blue})`
        ctx.fillRect(c * CELL_W, r * CELL_H, CELL_W, CELL_H)
      }
    }
  }, [stoch, mode])

  const cycleMode = useCallback(() => {
    const next = MODE_CYCLE[(MODE_CYCLE.indexOf(mode) + 1) % MODE_CYCLE.length]
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, mode: next } } : n)),
    )
  }, [id, mode, setNodes])

  const showImage = mode === 'image' || mode === 'both'
  const showMatrix = mode === 'matrix' || mode === 'both'

  return (
    <div
      className="zflow-node"
      style={{
        position: 'relative',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: 'var(--node-shadow)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 128,
        fontFamily: 'inherit',
      }}
    >
      <Handle type="target" position={Position.Left} />

      {/* START badge — absolute, top-left */}
      {is_first && (
        <div style={{
          position: 'absolute',
          top: -1,
          left: -1,
          zIndex: 1,
          background: 'var(--accent)',
          color: 'var(--accent-fg)',
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.05em',
          padding: '1px 6px',
          borderRadius: '0 0 6px 0',
          pointerEvents: 'none',
        }}>
          START
        </div>
      )}

      {/* Cycle icon button — top-right */}
      <button
        className="nodrag nopan"
        onClick={cycleMode}
        title="Cycle display mode"
        style={{
          position: 'absolute',
          top: 5,
          right: 5,
          zIndex: 1,
          width: 18,
          height: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1px solid transparent',
          borderRadius: 4,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: 0,
          transition: 'border-color 0.1s, background 0.1s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.background = 'var(--bg-surface-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'transparent'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <CycleIcon />
      </button>

      {/* Image */}
      {showImage && image_b64 && (
        <img
          src={`data:image/png;base64,${image_b64}`}
          alt="observation"
          draggable={false}
          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
        />
      )}

      {/* Matrix heatmap */}
      {showMatrix && stoch && (
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', imageRendering: 'pixelated' }}
        />
      )}

      {/* Mode label */}
      <div style={{
        textAlign: 'center',
        fontSize: 10,
        color: 'var(--text-secondary)',
        padding: '3px 0',
        borderTop: '1px solid var(--border)',
        fontFamily: 'inherit',
      }}>
        {mode}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  )
}
