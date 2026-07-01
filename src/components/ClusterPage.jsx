import { useState, useEffect, useCallback } from 'react'
import { useClusterState } from '../lib/useClusterState'
import { ClusterStatePanel } from './ClusterStatePanel'
import { ComparisonPanel } from './ComparisonPanel'
import { colorForCluster } from '../lib/clusterColors'

const LIMIT = 200

// Adapts a /clusters/states/{id} detail response to ComparisonPanel's
// view-agnostic shape.
function toComparisonState(detail) {
  if (!detail) return null
  return {
    id: detail.id,
    image_b64: detail.image_b64,
    stoch: detail.stoch,
    label: `trajectory ${detail.trajectory_id} · t=${detail.timestep}`,
  }
}

export function ClusterPage({ clusterId, serverUrl, onBack }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [compareId, setCompareId] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setOffset(0)
    setSelectedId(null)
    setCompareId(null)
    fetch(`${serverUrl}/clusters/${clusterId}/states?limit=${LIMIT}&offset=0`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setItems(data.states)
        setTotal(data.total)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [clusterId, serverUrl])

  const loadMore = useCallback(() => {
    const next = offset + LIMIT
    setLoading(true)
    fetch(`${serverUrl}/clusters/${clusterId}/states?limit=${LIMIT}&offset=${next}`)
      .then((r) => r.json())
      .then((data) => {
        setItems((prev) => [...prev, ...data.states])
        setOffset(next)
      })
      .finally(() => setLoading(false))
  }, [clusterId, offset, serverUrl])

  // Plain click selects/replaces the inspected state. Shift/Ctrl/Cmd+click on
  // a second state, while one is already selected, pins it as the compare
  // target instead — mirrors the live page's node-selection model.
  const onThumbClick = useCallback((e, id) => {
    if ((e.shiftKey || e.ctrlKey || e.metaKey) && selectedId && selectedId !== id) {
      setCompareId(id)
      return
    }
    setSelectedId((prev) => prev === id ? null : id)
    setCompareId(null)
  }, [selectedId])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key !== 'Escape') return
      if (compareId) setCompareId(null)
      else if (selectedId) setSelectedId(null)
      else onBack()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedId, compareId, onBack])

  const { detail: detailA, loading: loadingA } = useClusterState(serverUrl, selectedId)
  const { detail: detailB } = useClusterState(serverUrl, compareId)

  return (
    <div style={{ position: 'absolute', inset: 0, top: 40, display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        height: 40, flexShrink: 0, padding: '0 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            height: 28, padding: '0 10px',
            border: 'none', borderRadius: 6,
            background: 'transparent',
            color: 'var(--text-primary)',
            fontSize: 12, fontFamily: 'inherit',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          ← back to map
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} />

        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorForCluster(clusterId), flexShrink: 0 }} />
          Cluster {clusterId} · {total} state{total !== 1 ? 's' : ''}
        </span>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          click to inspect · shift/ctrl+click a second state to compare
        </span>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: 16,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8,
        alignContent: 'start',
      }}>
        {items.map((it) => {
          const isSelected = it.id === selectedId
          const isCompare = it.id === compareId
          return (
            <img
              key={it.id}
              src={`data:image/png;base64,${it.image_b64}`}
              alt={it.id}
              draggable={false}
              onClick={(e) => onThumbClick(e, it.id)}
              style={{
                width: '100%', borderRadius: 6, cursor: 'pointer', display: 'block',
                outline: isSelected ? '3px solid var(--accent)' : isCompare ? '3px solid rgb(217, 70, 239)' : 'none',
                outlineOffset: -1,
              }}
            />
          )
        })}
      </div>

      {items.length < total && (
        <div style={{ padding: 10, borderTop: '1px solid var(--border)', flexShrink: 0, textAlign: 'center' }}>
          <button
            onClick={loadMore}
            disabled={loading}
            style={{
              height: 28,
              padding: '0 14px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'inherit',
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Loading…' : `Load more (${items.length}/${total})`}
          </button>
        </div>
      )}

      <ClusterStatePanel
        stateId={compareId ? null : selectedId}
        detail={detailA}
        loading={loadingA}
        onClose={() => setSelectedId(null)}
        onSelect={setSelectedId}
      />

      <ComparisonPanel
        stateA={toComparisonState(detailA)}
        stateB={toComparisonState(detailB)}
        onClose={() => setCompareId(null)}
      />
    </div>
  )
}
