import { useState, useEffect, useMemo } from 'react'

function barColor(ratio) {
  if (ratio < 0.3) return '#ef4444'
  if (ratio < 0.7) return '#f59e0b'
  return '#22c55e'
}

export function RowStatsPanel({ serverUrl, onClose }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${serverUrl}/clusters/row_stats`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setStats(data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [serverUrl])

  // Most concentrated (most likely "structural") rows first, so the
  // interesting ones are visible without scrolling.
  const rows = useMemo(() => {
    if (!stats) return []
    return stats.entropy_ratio
      .map((ratio, row) => ({
        row,
        ratio,
        dominantCategory: stats.dominant_category[row],
        dominantFrac: stats.dominant_frac[row],
      }))
      .sort((a, b) => a.ratio - b.ratio)
  }, [stats])

  return (
    <div style={{
      position: 'absolute', top: 48, left: 12, zIndex: 10,
      width: 280,
      maxHeight: 'calc(100vh - 250px)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-surface)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      fontFamily: 'inherit',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>Row concentration</span>
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 18, height: 18, border: 'none', borderRadius: 4,
            background: 'transparent', color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 12, padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          title="Close"
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {loading && !stats && (
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Loading…</span>
        )}
        {rows.map(({ row, ratio, dominantCategory, dominantFrac }) => (
          <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ width: 16, fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'monospace', textAlign: 'right', flexShrink: 0 }}>
              {row}
            </span>
            <div style={{ flex: 1, height: 8, background: 'var(--bg-canvas)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${ratio * 100}%`, height: '100%', background: barColor(ratio) }} />
            </div>
            <span style={{ width: 76, fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'monospace', flexShrink: 0, textAlign: 'right' }}>
              cat {dominantCategory} · {Math.round(dominantFrac * 100)}%
            </span>
          </div>
        ))}
      </div>

      {stats && (
        <div style={{
          padding: '6px 10px', borderTop: '1px solid var(--border)', flexShrink: 0,
          fontSize: 9, color: 'var(--text-secondary)', lineHeight: 1.4,
        }}>
          sorted by concentration (red → green) · bar = entropy ÷ log2(K) · text = dominant category & its frequency
        </div>
      )}
    </div>
  )
}
