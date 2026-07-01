import { MatrixCanvas } from './MatrixCanvas'
import { colorForCluster } from '../lib/clusterColors'

function NavButton({ direction, disabled, onClick, size = 24 }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={direction === 'prev' ? 'Previous timestep in trajectory' : 'Next timestep in trajectory'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size,
        border: '1px solid var(--border)',
        borderRadius: 6,
        background: 'transparent',
        color: disabled ? 'var(--border-strong)' : 'var(--text-primary)',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 11,
        padding: 0,
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      {direction === 'prev' ? '←' : '→'}
    </button>
  )
}

export function ClusterStatePanel({ stateId, detail, loading, onClose, onSelect, onViewCluster, clusterCounts }) {
  if (!stateId) return null

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
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
            {detail && (
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: colorForCluster(detail.cluster_id), flexShrink: 0,
              }} />
            )}
            State {detail ? `· cluster ${detail.cluster_id}` : ''}
          </span>
          {detail ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <NavButton direction="prev" size={16} disabled={!detail.prev_id} onClick={() => onSelect(detail.prev_id)} />
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                trajectory {detail.trajectory_id} · t={detail.timestep}
              </span>
              <NavButton direction="next" size={16} disabled={!detail.next_id} onClick={() => onSelect(detail.next_id)} />
            </div>
          ) : (
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {stateId}
            </span>
          )}
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 12px' }}>
        {loading && !detail && (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Loading…</span>
        )}

        {detail && (
          <>
            <img
              src={`data:image/png;base64,${detail.image_b64}`}
              alt="state observation"
              draggable={false}
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4, objectFit: 'contain', marginBottom: 8 }}
            />
            <MatrixCanvas stoch={detail.stoch} />
            {onViewCluster && (
              <button
                onClick={() => onViewCluster(detail.cluster_id)}
                style={{
                  marginTop: 10,
                  width: '100%',
                  height: 28,
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                View full cluster{clusterCounts ? ` (${clusterCounts[detail.cluster_id] ?? 0})` : ''}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
