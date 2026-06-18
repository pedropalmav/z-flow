import { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'reactflow'

import { parseTrajectory } from './lib/parser'
import { applyLayout } from './lib/layout'
import { StateNode } from './components/StateNode'
import { TransitionEdge } from './components/TransitionEdge'
import { Toolbar, readFileAsJson } from './components/Toolbar'

const nodeTypes = { stateNode: StateNode }
const edgeTypes = { transitionEdge: TransitionEdge }

function Flow({ theme, onThemeToggle }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [metadata, setMetadata] = useState(null)
  const [globalMode, setGlobalMode] = useState('image')
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const handleFileLoad = useCallback((json) => {
    const { nodes: parsedNodes, edges: parsedEdges, metadata: meta } = parseTrajectory(json)
    const laidOutNodes = applyLayout(parsedNodes, parsedEdges)
    setNodes(laidOutNodes)
    setEdges(parsedEdges)
    setMetadata(meta)
  }, [setNodes, setEdges])

  const handleGlobalModeChange = useCallback((mode) => {
    setGlobalMode(mode)
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, mode } })))
  }, [setNodes])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDraggingOver(true)
  }, [])

  const onDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDraggingOver(false)
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files[0]
    if (file) readFileAsJson(file, handleFileLoad)
  }, [handleFileLoad])

  const isEmpty = nodes.length === 0

  return (
    <div
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Canvas fills full screen — toolbar floats on top */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        style={{ position: 'absolute', inset: 0 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
        <Controls />
      </ReactFlow>

      {/* Toolbar overlays canvas — blur shows canvas behind */}
      <Toolbar
        metadata={metadata}
        nodeCount={nodes.length}
        onFileLoad={handleFileLoad}
        globalMode={globalMode}
        onGlobalModeChange={handleGlobalModeChange}
        theme={theme}
        onThemeToggle={onThemeToggle}
      />

      {/* Drop overlay */}
      {isDraggingOver && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
          border: '2px dashed var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}>
            Drop trajectory JSON
          </span>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && !isDraggingOver && (
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
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Drop a trajectory JSON or use Load JSON</span>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('zflow-theme') ?? 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('zflow-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  return (
    <ReactFlowProvider>
      <Flow theme={theme} onThemeToggle={toggleTheme} />
    </ReactFlowProvider>
  )
}
