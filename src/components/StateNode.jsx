import { Handle, Position } from 'reactflow'

const H = { opacity: 0, pointerEvents: 'none' }

export function StateNode({ data }) {
  const { image_b64, is_first, isCurrent, isSelected, isCompareTarget, stoch_entries } = data
  const timestep = stoch_entries?.at(-1)?.timestep

  const border = (is_first && !isCurrent) ? '2px solid var(--accent)' : '1px solid var(--border)'
  const shadows = ['var(--node-shadow)']
  if (isSelected) shadows.push('0 0 0 2px rgb(217, 70, 239)')
  if (isCompareTarget) shadows.push('0 0 0 2px #38bdf8')
  if (isCurrent) shadows.push('0 0 0 2px #f59e0b')
  const boxShadow = shadows.join(', ')

  return (
    <div
      className="zflow-node"
      style={{
        position: 'relative',
        background: 'var(--bg-surface)',
        border,
        borderRadius: 8,
        boxShadow,
        overflow: 'hidden',
        width: 128,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {/* Source handles — s-right first so it's the default for unspecified edges */}
      <Handle id="s-right"  type="source" position={Position.Right}  style={H} />
      <Handle id="s-left"   type="source" position={Position.Left}   style={H} />
      <Handle id="s-top"    type="source" position={Position.Top}    style={H} />
      <Handle id="s-bottom" type="source" position={Position.Bottom} style={H} />

      {/* Target handles — t-left first so it's the default for unspecified edges */}
      <Handle id="t-left"   type="target" position={Position.Left}   style={H} />
      <Handle id="t-right"  type="target" position={Position.Right}  style={H} />
      <Handle id="t-top"    type="target" position={Position.Top}    style={H} />
      <Handle id="t-bottom" type="target" position={Position.Bottom} style={H} />

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

      {timestep !== undefined && (
        <div style={{
          position: 'absolute',
          top: -1,
          right: -1,
          zIndex: 1,
          background: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          fontSize: 9,
          fontWeight: 500,
          fontFamily: 'monospace',
          padding: '1px 6px',
          borderRadius: '0 0 0 6px',
          border: '1px solid var(--border)',
          borderTop: 'none',
          borderRight: 'none',
          pointerEvents: 'none',
        }}>
          t={timestep}
        </div>
      )}

      {image_b64 && (
        <img
          src={`data:image/png;base64,${image_b64}`}
          alt="observation"
          draggable={false}
          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
        />
      )}
    </div>
  )
}
