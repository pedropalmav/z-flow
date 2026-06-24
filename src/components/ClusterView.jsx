import { useState, useEffect, useCallback } from 'react'
import { SunIcon, MoonIcon } from './Toolbar'
import { ClusterScatter } from './ClusterScatter'
import { ClusterLegend } from './ClusterLegend'
import { ClusterStatePanel } from './ClusterStatePanel'
import { ClusterPage } from './ClusterPage'
import { RowStatsPanel } from './RowStatsPanel'
import { useClusterState } from '../lib/useClusterState'

const btnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 28,
  padding: '0 10px',
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-primary)',
  fontSize: 12,
  fontWeight: 400,
  fontFamily: 'inherit',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

function Divider() {
  return (
    <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0, margin: '0 4px' }} />
  )
}

function ColorByToggle({ colorBy, onChange }) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
      {['cluster', 'trajectory'].map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          style={{
            ...btnBase,
            height: 26,
            borderRadius: 0,
            background: colorBy === mode ? 'var(--bg-surface-hover)' : 'transparent',
            color: colorBy === mode ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: colorBy === mode ? 500 : 400,
          }}
        >
          {mode === 'cluster' ? 'Cluster' : 'Trajectory'}
        </button>
      ))}
    </div>
  )
}

function ClusterToolbar({
  serverUrl, onServerUrlChange, onReload, loading, error, nStates, k, nTrajectories,
  colorBy, onColorByChange, showRowStats, onToggleRowStats,
  theme, onThemeToggle, onHome,
}) {
  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0,
      zIndex: 10,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 4,
      background: 'var(--bg-surface)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <button
        style={{
          display: 'inline-flex', alignItems: 'center',
          height: 28, padding: '0 6px',
          border: 'none', borderRadius: 6,
          background: 'transparent',
          fontSize: 13, fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        onClick={onHome}
        title="Back to home"
      >
        z-flow
      </button>

      <Divider />

      <input
        type="text"
        value={serverUrl}
        onChange={(e) => onServerUrlChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onReload() }}
        placeholder="http://localhost:8765"
        style={{
          height: 28,
          padding: '0 8px',
          border: '1px solid var(--border)',
          borderRadius: 6,
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          fontSize: 12,
          fontFamily: 'inherit',
          outline: 'none',
          width: 200,
        }}
      />
      <button
        style={btnBase}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        onClick={onReload}
        disabled={loading}
      >
        {loading ? 'Loading…' : 'Reload'}
      </button>

      <Divider />

      <ColorByToggle colorBy={colorBy} onChange={onColorByChange} />

      <button
        style={{
          ...btnBase, padding: '0 8px',
          color: showRowStats ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: showRowStats ? 'var(--bg-surface-hover)' : 'transparent',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = showRowStats ? 'var(--bg-surface-hover)' : 'transparent'; e.currentTarget.style.color = showRowStats ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        onClick={onToggleRowStats}
      >
        Row stats
      </button>

      <div style={{ flex: 1 }} />

      <span style={{ color: error ? '#ef4444' : 'var(--text-secondary)', fontSize: 12 }}>
        {error ? `Error: ${error}` : `${nStates} states · ${k} clusters · ${nTrajectories} trajectories`}
      </span>

      <Divider />

      <button
        style={{ ...btnBase, padding: '0 8px', color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        onClick={onThemeToggle}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  )
}

export function ClusterView({ theme, onThemeToggle, onHome }) {
  const [serverUrl, setServerUrl] = useState('http://localhost:8765')
  const [states, setStates] = useState([])
  const [k, setK] = useState(0)
  const [nTrajectories, setNTrajectories] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [openClusterId, setOpenClusterId] = useState(null)
  const [colorBy, setColorBy] = useState('cluster')
  const [highlightedTrajectoryId, setHighlightedTrajectoryId] = useState(null)
  const [showRowStats, setShowRowStats] = useState(false)

  const loadStates = useCallback((url) => {
    setLoading(true)
    setError(null)
    fetch(`${url}/clusters/states`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setStates(data.states)
        setK(data.k)
        setNTrajectories(data.n_trajectories)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadStates(serverUrl) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleColorByChange = useCallback((mode) => {
    setColorBy(mode)
    setHighlightedTrajectoryId(null)
  }, [])

  const handleSelectGroup = useCallback((id) => {
    if (colorBy === 'cluster') {
      setOpenClusterId(id)
    } else {
      setHighlightedTrajectoryId((prev) => prev === id ? null : id)
    }
  }, [colorBy])

  const clusterCounts = states.reduce((acc, s) => {
    acc[s.cluster_id] = (acc[s.cluster_id] ?? 0) + 1
    return acc
  }, {})

  const { detail, loading: detailLoading } = useClusterState(serverUrl, openClusterId == null ? selectedId : null)

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ClusterToolbar
        serverUrl={serverUrl}
        onServerUrlChange={setServerUrl}
        onReload={() => loadStates(serverUrl)}
        loading={loading}
        error={error}
        nStates={states.length}
        k={k}
        nTrajectories={nTrajectories}
        colorBy={colorBy}
        onColorByChange={handleColorByChange}
        showRowStats={showRowStats}
        onToggleRowStats={() => setShowRowStats((v) => !v)}
        theme={theme}
        onThemeToggle={onThemeToggle}
        onHome={onHome}
      />

      {openClusterId != null ? (
        <ClusterPage
          clusterId={openClusterId}
          serverUrl={serverUrl}
          onBack={() => setOpenClusterId(null)}
        />
      ) : (
        <>
          <ClusterScatter
            states={states}
            selectedId={selectedId}
            onSelect={setSelectedId}
            colorBy={colorBy}
            highlightedTrajectoryId={highlightedTrajectoryId}
          />
          <ClusterLegend
            count={colorBy === 'cluster' ? k : nTrajectories}
            states={states}
            colorBy={colorBy}
            selectedGroupId={colorBy === 'trajectory' ? highlightedTrajectoryId : null}
            onSelectGroup={handleSelectGroup}
          />
          {showRowStats && (
            <RowStatsPanel serverUrl={serverUrl} onClose={() => setShowRowStats(false)} />
          )}

          <ClusterStatePanel
            stateId={selectedId}
            detail={detail}
            loading={detailLoading}
            onClose={() => setSelectedId(null)}
            onSelect={setSelectedId}
            onViewCluster={(clusterId) => setOpenClusterId(clusterId)}
            clusterCounts={clusterCounts}
          />
        </>
      )}
    </div>
  )
}
