import { getBezierPath, EdgeLabelRenderer } from 'reactflow'

const COLOR = '217, 70, 239'
const MIN_OPACITY = 0.08

export function SimilarityEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) {
  const similarity = data?.similarity ?? 0
  const opacity = MIN_OPACITY + (1 - MIN_OPACITY) * similarity

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  })

  return (
    <>
      {/* Wide invisible hit-target so the thin styled line below is easy to click */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={16} style={{ cursor: 'pointer' }} />

      <path
        d={edgePath}
        fill="none"
        style={{ stroke: `rgba(${COLOR}, ${opacity})`, strokeWidth: 1 + similarity * 2, pointerEvents: 'none' }}
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            fontSize: 10,
            color: `rgb(${COLOR})`,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '1px 4px',
            pointerEvents: 'none',
            fontFamily: 'inherit',
            lineHeight: '14px',
          }}
        >
          {Math.round(similarity * 100)}%
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
