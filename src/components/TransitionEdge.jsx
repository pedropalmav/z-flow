import { getBezierPath, EdgeLabelRenderer } from 'reactflow'

export function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const markerId = `zflow-marker-${id}`
  const pathId = `zflow-path-${id}`

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L0,8 L8,4 z" style={{ fill: 'var(--border-strong)' }} />
        </marker>
      </defs>

      {/* Edge path */}
      <path
        id={pathId}
        className="zflow-edge-path"
        d={edgePath}
        fill="none"
        style={{ stroke: 'var(--border-strong)', strokeWidth: 1.5 }}
        markerEnd={`url(#${markerId})`}
      />

      {/* Animated dot traveling along the path */}
      <circle r="3" style={{ fill: 'var(--border-strong)' }}>
        <animateMotion dur="2s" repeatCount="indefinite" calcMode="linear">
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>

      {/* Step label */}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            fontSize: 10,
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '1px 4px',
            pointerEvents: 'none',
            fontFamily: 'inherit',
            lineHeight: '14px',
          }}
        >
          {data?.step ?? ''}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
