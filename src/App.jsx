import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'

import { applyLiveLayout } from './lib/layout'
import { rowMatchSimilarity } from './lib/similarity'
import { StateNode } from './components/StateNode'
import { TransitionEdge } from './components/TransitionEdge'
import { SimilarityEdge } from './components/SimilarityEdge'
import { ActionPanel } from './components/ActionPanel'
import { StochPanel } from './components/StochPanel'
import { ComparisonPanel } from './components/ComparisonPanel'
import { Toolbar } from './components/Toolbar'
import { ClusterView } from './components/ClusterView'
import { HomePage } from './components/HomePage'

const nodeTypes = { stateNode: StateNode }
const edgeTypes = { transitionEdge: TransitionEdge, similarityEdge: SimilarityEdge }

const VALID_PAGES = ['home', 'live', 'clusters']

function getPageFromHash() {
  const hash = window.location.hash.slice(1)
  return VALID_PAGES.includes(hash) ? hash : 'home'
}

function MaximizeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
    </svg>
  )
}

function MinimizeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v5H3M21 8h-5V3M3 16h5v5M16 21v-5h5"/>
    </svg>
  )
}

// Adapts a ReactFlow state node to ComparisonPanel's view-agnostic shape.
function toComparisonState(node) {
  if (!node) return null
  const entry = node.data.stoch_entries?.at(-1)
  if (!entry) return null
  return { id: node.id, image_b64: node.data.image_b64, stoch: entry.stoch, label: `t=${entry.timestep}` }
}

function getOptimalHandles(srcPos, tgtPos) {
  const dx = tgtPos.x - srcPos.x
  const dy = tgtPos.y - srcPos.y
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: 's-right', targetHandle: 't-left' }
      : { sourceHandle: 's-left',  targetHandle: 't-right' }
  }
  return dy >= 0
    ? { sourceHandle: 's-bottom', targetHandle: 't-top' }
    : { sourceHandle: 's-top',    targetHandle: 't-bottom' }
}

const KEY_TO_ACTION = {
  ArrowLeft: 0,
  ArrowRight: 1,
  ArrowUp: 2,
  p: 3,
  d: 4,
  ' ': 5,
  Enter: 6,
}

const FOCUS_BASE_RADIUS = 200
const FOCUS_RADIUS_SPREAD = 320
const FOCUS_NODE_SPACING = 150

// Radial layout for "focus mode": other nodes arranged around the selected
// node, distance inversely proportional to stoch row-match similarity.
function computeFocusLayout(source, others) {
  const minRadius = Math.max(FOCUS_BASE_RADIUS, (others.length * FOCUS_NODE_SPACING) / (2 * Math.PI))
  const center = source.position
  const positions = {}
  const similarities = {}
  const stochA = source.data.stoch_entries.at(-1)?.stoch

  others.forEach((n, i) => {
    const stochB = n.data.stoch_entries.at(-1)?.stoch
    const similarity = rowMatchSimilarity(stochA, stochB)
    const radius = minRadius + (1 - similarity) * FOCUS_RADIUS_SPREAD
    const angle = (i / others.length) * 2 * Math.PI
    similarities[n.id] = similarity
    positions[n.id] = {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    }
  })

  return { center, positions, similarities }
}

function Flow({ theme, onThemeToggle, onHome }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [metadata, setMetadata] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [compareNodeId, setCompareNodeId] = useState(null)

  // Live mode
  const [connected, setConnected] = useState(false)
  const [wsUrl, setWsUrl] = useState('ws://localhost:8765/ws')
  const wsRef = useRef(null)
  const [currentImage, setCurrentImage] = useState(null)
  const [currentStep, setCurrentStep] = useState(null)
  const [currentNodeId, setCurrentNodeId] = useState(null)
  const [obsFullscreen, setObsFullscreen] = useState(false)

  // Always-current refs so the layout effect never reads stale closures
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  nodesRef.current = nodes
  edgesRef.current = edges

  // Re-layout whenever the graph structure changes in live mode;
  // also update edge handles to reflect the new node positions.
  useEffect(() => {
    if (!connected || nodesRef.current.length === 0) return
    const laidOut = applyLiveLayout(nodesRef.current, edgesRef.current)
    const posById = Object.fromEntries(laidOut.map((n) => [n.id, n.position]))
    setNodes(laidOut)
    setEdges((prevEdges) => prevEdges.map((edge) => {
      const srcPos = posById[edge.source]
      const tgtPos = posById[edge.target]
      if (!srcPos || !tgtPos) return edge
      return { ...edge, ...getOptimalHandles(srcPos, tgtPos) }
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, nodes.length, edges.length])

  // Radial "focus mode" layout: positions + similarities of every other node
  // relative to the selected one. Render-only — never enters `nodes`/`edges`
  // state, so it can't trigger the layout effect or feed the force sim.
  const focusLayout = useMemo(() => {
    if (!selectedNodeId) return null
    const source = nodes.find((n) => n.id === selectedNodeId)
    if (!source) return null
    const others = nodes.filter((n) => n.id !== selectedNodeId)
    return computeFocusLayout(source, others)
  }, [selectedNodeId, nodes])

  const comparisonEdges = useMemo(() => {
    if (!selectedNodeId || !focusLayout) return []
    return Object.keys(focusLayout.similarities).map((targetId) => {
      const { sourceHandle, targetHandle } = getOptimalHandles(focusLayout.center, focusLayout.positions[targetId])
      return {
        id: `cmp-${selectedNodeId}-${targetId}`,
        source: selectedNodeId,
        target: targetId,
        sourceHandle,
        targetHandle,
        type: 'similarityEdge',
        data: { similarity: focusLayout.similarities[targetId] },
      }
    })
  }, [selectedNodeId, focusLayout])

  // Highlight + focus-mode position, kept out of canonical node data/position
  // so drag updates via onNodesChange and the trajectory layout stay untouched.
  const displayNodes = useMemo(
    () => nodes.map((n) => ({
      ...n,
      position: focusLayout?.positions[n.id] ?? n.position,
      data: {
        ...n.data,
        isSelected: n.id === selectedNodeId,
        isCompareTarget: n.id === compareNodeId,
      },
    })),
    [nodes, selectedNodeId, compareNodeId, focusLayout]
  )

  // Pan (but don't zoom) the camera to the selected node when entering focus
  // mode; re-fit the whole trajectory when leaving it.
  const { setCenter, fitView, getZoom } = useReactFlow()
  useEffect(() => {
    if (focusLayout) {
      setCenter(focusLayout.center.x, focusLayout.center.y, { zoom: getZoom(), duration: 400 })
    } else {
      fitView({ padding: 0.3, duration: 400 })
    }
  }, [focusLayout, setCenter, fitView, getZoom])

  useEffect(() => () => wsRef.current?.close(), [])

  const connect = useCallback((url) => {
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => {
      setConnected(false)
      wsRef.current = null
      setCurrentImage(null)
      setCurrentStep(null)
      setCurrentNodeId(null)
      setObsFullscreen(false)
    }
    ws.onerror = (e) => console.error('[z-flow] WebSocket error', e)

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data)

      if (msg.type === 'metadata') {
        setMetadata(msg.metadata)
        return
      }

      if (msg.type === 'step') {
        const { node_id, node: rawNode, stoch_entry, edge: rawEdge, image_b64 } = msg
        const imgB64 = image_b64 ?? rawNode?.image_b64
        if (imgB64) setCurrentImage(imgB64)
        setCurrentStep(stoch_entry.timestep)
        setCurrentNodeId(node_id)

        setNodes((prev) => {
          const cleared = prev.map((n) =>
            n.data.isCurrent ? { ...n, data: { ...n.data, isCurrent: false } } : n
          )
          return [...cleared, {
            id: rawNode.id,
            type: 'stateNode',
            position: { x: prev.length * 160, y: 0 },  // overwritten by layout effect
            data: {
              image_b64: rawNode.image_b64,
              is_first: rawNode.is_first ?? false,
              stoch_entries: [stoch_entry],
              isCurrent: true,
            },
          }]
        })

        if (rawEdge) {
          setEdges((prev) => [...prev, {
            id: `e-${rawEdge.source}-${rawEdge.target}-${stoch_entry.timestep}`,
            source: rawEdge.source,
            target: rawEdge.target,
            type: 'transitionEdge',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            data: { step: stoch_entry.timestep - 1 },
          }])
        }
      }
      // 'done' → no-op
    }
  }, [setNodes, setEdges])

  const disconnect = useCallback(() => wsRef.current?.close(), [])

  const sendAction = useCallback((actionIdx) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'action', action_idx: actionIdx }))
    }
  }, [])

  const resetEpisode = useCallback(() => {
    setNodes([])
    setEdges([])
    setSelectedNodeId(null)
    setCompareNodeId(null)
    setCurrentImage(null)
    setCurrentStep(null)
    setCurrentNodeId(null)
    setObsFullscreen(false)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'reset' }))
    }
  }, [setNodes, setEdges])

  // Keyboard shortcuts for live mode — skip if a text input is focused
  useEffect(() => {
    if (!connected) return
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      const idx = KEY_TO_ACTION[e.key]
      if (idx !== undefined) {
        e.preventDefault()
        sendAction(idx)
      }
      if (e.key === 'Escape') { setSelectedNodeId(null); setCompareNodeId(null); setObsFullscreen(false) }
      if (e.key === 'r') resetEpisode()
      if (e.key === 'f') setObsFullscreen((v) => !v)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [connected, sendAction, resetEpisode])

  // Escape closes panels in file mode too
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') { setSelectedNodeId(null); setCompareNodeId(null); setObsFullscreen(false) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Plain click selects/focuses a node (and closes any open comparison).
  // Shift/Ctrl/Cmd+click on a second node, while one is already focused,
  // pins it as the comparison target instead of changing the focus.
  const onNodeClick = useCallback((event, node) => {
    if ((event.shiftKey || event.ctrlKey || event.metaKey) && selectedNodeId && selectedNodeId !== node.id) {
      setCompareNodeId(node.id)
      return
    }
    setSelectedNodeId((prev) => prev === node.id ? null : node.id)
    setCompareNodeId(null)
  }, [selectedNodeId])

  // Clicking a similarity arrow compares its two endpoint states directly.
  const onEdgeClick = useCallback((_event, edge) => {
    if (edge.type === 'similarityEdge') setCompareNodeId(edge.target)
  }, [])

  const onPaneClick = useCallback(() => { setSelectedNodeId(null); setCompareNodeId(null) }, [])

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null
  const isEmpty = nodes.length === 0

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ReactFlow
        nodes={displayNodes}
        edges={selectedNodeId ? comparisonEdges : edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        style={{ position: 'absolute', inset: 0 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
        <Controls />
        <MiniMap
          position="bottom-left"
          nodeColor={(n) => {
            if (n.data?.isCurrent) return '#f59e0b'
            if (n.data?.is_first) return 'var(--accent)'
            return 'var(--text-secondary)'
          }}
          maskColor="color-mix(in srgb, var(--bg-canvas) 70%, transparent)"
          maskStrokeColor="var(--accent)"
          maskStrokeWidth={5}
          style={{
            background: 'var(--bg-canvas)',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}
        />
      </ReactFlow>

      <Toolbar
        metadata={metadata}
        nodeCount={nodes.length}
        theme={theme}
        onThemeToggle={onThemeToggle}
        connected={connected}
        wsUrl={wsUrl}
        onWsUrlChange={setWsUrl}
        onConnect={connect}
        onDisconnect={disconnect}
        onHome={onHome}
      />

      {connected && (
        <ActionPanel onAction={sendAction} onReset={resetEpisode} />
      )}

      <StochPanel node={selectedNode} onClose={() => { setSelectedNodeId(null); setCompareNodeId(null) }} />

      <ComparisonPanel
        stateA={toComparisonState(selectedNode)}
        stateB={toComparisonState(compareNodeId ? nodes.find((n) => n.id === compareNodeId) ?? null : null)}
        onClose={() => setCompareNodeId(null)}
      />

      {connected && currentImage && obsFullscreen && (
        <div
          onClick={() => setObsFullscreen(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 19,
            background: 'rgba(0,0,0,0.45)',
          }}
        />
      )}

      {connected && currentImage && (
        <div style={obsFullscreen ? {
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
          width: 480,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          fontFamily: 'inherit',
        } : {
          position: 'absolute',
          top: 48, left: 12,
          zIndex: 15,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          overflow: 'hidden',
          width: 200,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontFamily: 'inherit',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: obsFullscreen ? '6px 12px' : '3px 8px',
            fontSize: 10,
            color: 'var(--text-secondary)',
            borderBottom: '1px solid var(--border)',
          }}>
            <span>current{currentStep !== null ? ` · t = ${currentStep}` : ''}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setObsFullscreen((v) => !v) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 18, height: 18,
                border: 'none', borderRadius: 3,
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer', padding: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              title={obsFullscreen ? 'Minimize (F)' : 'Maximize (F)'}
            >
              {obsFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
            </button>
          </div>
          <img
            src={`data:image/png;base64,${currentImage}`}
            alt="current observation"
            draggable={false}
            style={{ width: '100%', display: 'block' }}
          />
        </div>
      )}

      {isEmpty && (
        <div style={{
          position: 'absolute', inset: 0, top: 40, zIndex: 5,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', userSelect: 'none',
          gap: 6,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            <line x1="7" y1="12" x2="10" y2="12"/><line x1="14" y1="12" x2="17" y2="12"/>
          </svg>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {connected
              ? 'Connected — press an action key or use the panel below'
              : 'Connect to a live backend to begin'}
          </span>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('zflow-theme') ?? 'light')
  const [page, setPage] = useState(() => getPageFromHash())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('zflow-theme', theme)
  }, [theme])

  // The hash is the single source of truth for the current page, so browser
  // back/forward (which change the hash without a full reload) land here too.
  useEffect(() => {
    const syncFromHash = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [])

  const toggleTheme = useCallback(() => setTheme((t) => t === 'light' ? 'dark' : 'light'), [])
  const navigate = useCallback((nextPage) => { window.location.hash = nextPage }, [])
  const goHome = useCallback(() => navigate('home'), [navigate])

  if (page === 'home') {
    return <HomePage theme={theme} onThemeToggle={toggleTheme} onSelect={navigate} />
  }

  if (page === 'clusters') {
    return <ClusterView theme={theme} onThemeToggle={toggleTheme} onHome={goHome} />
  }

  return (
    <ReactFlowProvider>
      <Flow theme={theme} onThemeToggle={toggleTheme} onHome={goHome} />
    </ReactFlowProvider>
  )
}
