import { useMemo } from 'react'
import { colorForCluster } from '../lib/clusterColors'

// In cluster mode, clicking a row opens that cluster's full page. In
// trajectory mode, clicking toggles a path overlay for that trajectory on
// the scatter instead — there's no "page" for a single trajectory.
export function ClusterLegend({ count, states, colorBy = 'cluster', selectedGroupId = null, onSelectGroup }) {
  const groupKey = colorBy === 'trajectory' ? 'trajectory_id' : 'cluster_id'
  const label = colorBy === 'trajectory' ? 'trajectory' : 'cluster'

  const counts = useMemo(() => {
    const c = new Array(count).fill(0)
    for (const s of states) {
      const id = s[groupKey]
      if (id >= 0 && id < count) c[id] += 1
    }
    return c
  }, [count, states, groupKey])

  if (count === 0) return null

  return (
    <div style={{
      position: 'absolute', left: 12, bottom: 12, zIndex: 10,
      display: 'flex', flexDirection: 'column', gap: 4,
      padding: '8px 10px',
      background: 'var(--bg-surface)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      fontSize: 11,
      fontFamily: 'monospace',
      maxHeight: 200,
      overflowY: 'auto',
    }}>
      {counts.map((count, id) => {
        const isActive = id === selectedGroupId
        return (
          <div
            key={id}
            onClick={() => onSelectGroup?.(id)}
            title={colorBy === 'trajectory' ? `Highlight trajectory ${id}` : `Open cluster ${id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: onSelectGroup ? 'pointer' : 'default',
              borderRadius: 4, padding: '1px 4px', margin: '-1px -4px',
              background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
            }}
            onMouseEnter={(e) => { if (onSelectGroup) e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? 'var(--bg-surface-hover)' : 'transparent' }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: colorForCluster(id), flexShrink: 0,
            }} />
            <span style={{ color: 'var(--text-secondary)' }}>{label} {id}</span>
            <span style={{ color: 'var(--text-primary)', marginLeft: 'auto' }}>{count}</span>
          </div>
        )
      })}
    </div>
  )
}
