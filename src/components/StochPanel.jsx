import { MatrixCanvas } from './MatrixCanvas'

export function StochPanel({ node, onClose }) {
  if (!node) return null
  const { stoch_entries = [], is_first, image_b64 } = node.data

  return (
    <div style={{
      position: 'absolute',
      top: 48,
      right: 12,
      bottom: 12,
      width: 260,
      zIndex: 15,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-surface)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      overflow: 'hidden',
      fontFamily: 'inherit',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
            {is_first ? 'START' : 'State'} · {stoch_entries.length} visit{stoch_entries.length !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            {node.id}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22,
            border: 'none', borderRadius: 4,
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 14,
            padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Observation image */}
      {image_b64 && (
        <div style={{ padding: '8px 12px 4px', flexShrink: 0 }}>
          <img
            src={`data:image/png;base64,${image_b64}`}
            alt="observation"
            draggable={false}
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4, objectFit: 'contain' }}
          />
        </div>
      )}

      {/* Stoch entries — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 12px' }}>
        {stoch_entries.length === 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No data yet.</span>
        )}
        {stoch_entries.map((entry, i) => (
          <div key={i} style={{ marginTop: 10 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: 4,
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                t = {entry.timestep}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                r = {entry.reward.toFixed(2)}
              </span>
            </div>
            <MatrixCanvas stoch={entry.stoch} />
          </div>
        ))}
      </div>
    </div>
  )
}
