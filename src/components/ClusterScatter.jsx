import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { colorForCluster } from '../lib/clusterColors'

const PADDING_FRACTION = 0.1
const RADIUS_FRACTION = 0.012 // of base viewBox diagonal, kept fixed across zoom levels
const PATH_WIDTH_FRACTION = 0.004 // of base viewBox diagonal, for the trajectory-path overlay
const ZOOM_STEP = 1.15
const MAX_ZOOM_IN = 40 // how far below the base (fit-all) width we allow zooming
const MAX_ZOOM_OUT = 1.2 // how far above the base width we allow zooming out
const DRAG_THRESHOLD_PX = 4

function computeBaseView(states) {
  if (states.length === 0) return { minX: 0, minY: 0, w: 100, h: 100 }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const s of states) {
    if (s.x < minX) minX = s.x
    if (s.x > maxX) maxX = s.x
    if (s.y < minY) minY = s.y
    if (s.y > maxY) maxY = s.y
  }
  const w = Math.max(maxX - minX, 1e-6)
  const h = Math.max(maxY - minY, 1e-6)
  const padX = w * PADDING_FRACTION
  const padY = h * PADDING_FRACTION
  return { minX: minX - padX, minY: minY - padY, w: w + 2 * padX, h: h + 2 * padY }
}

export function ClusterScatter({ states, selectedId, onSelect, colorBy = 'cluster', highlightedTrajectoryId = null }) {
  const svgRef = useRef(null)
  const didDragRef = useRef(false)

  const baseView = useMemo(() => computeBaseView(states), [states])
  const radius = useMemo(() => Math.hypot(baseView.w, baseView.h) * RADIUS_FRACTION, [baseView])
  const pathWidth = useMemo(() => Math.hypot(baseView.w, baseView.h) * PATH_WIDTH_FRACTION, [baseView])
  const [view, setView] = useState(baseView)

  const groupIdOf = useCallback((s) => colorBy === 'trajectory' ? s.trajectory_id : s.cluster_id, [colorBy])

  // Points of the highlighted trajectory, in visit order, for the path overlay.
  const pathPoints = useMemo(() => {
    if (highlightedTrajectoryId == null) return null
    return states
      .filter((s) => s.trajectory_id === highlightedTrajectoryId)
      .sort((a, b) => a.timestep - b.timestep)
  }, [states, highlightedTrajectoryId])

  // SVG z-order follows render order, not selection state — split states so
  // the highlighted trajectory and the selected circle always paint last
  // (on top), regardless of where they fall in the original array.
  const { background, foreground, selected } = useMemo(() => {
    const background = []
    const foreground = []
    let selected = null
    for (const s of states) {
      if (s.id === selectedId) { selected = s; continue }
      if (highlightedTrajectoryId != null && s.trajectory_id === highlightedTrajectoryId) foreground.push(s)
      else background.push(s)
    }
    return { background, foreground, selected }
  }, [states, selectedId, highlightedTrajectoryId])

  // Reset pan/zoom whenever a fresh set of states is loaded.
  useEffect(() => { setView(baseView) }, [baseView])

  const zoomBy = useCallback((factor, pivotPx, pivotPy) => {
    setView((v) => {
      const minAllowedW = baseView.w / MAX_ZOOM_IN
      const maxAllowedW = baseView.w * MAX_ZOOM_OUT
      const candidateW = v.w * factor
      const clampedW = Math.min(Math.max(candidateW, minAllowedW), maxAllowedW)
      const appliedFactor = clampedW / v.w
      const newW = v.w * appliedFactor
      const newH = v.h * appliedFactor
      const dataX = v.minX + pivotPx * v.w
      const dataY = v.minY + pivotPy * v.h
      return {
        minX: dataX - pivotPx * newW,
        minY: dataY - pivotPy * newH,
        w: newW,
        h: newH,
      }
    })
  }, [baseView])

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    function handleWheel(e) {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      zoomBy(e.deltaY > 0 ? ZOOM_STEP : 1 / ZOOM_STEP, px, py)
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [zoomBy])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const start = { clientX: e.clientX, clientY: e.clientY, view }
    didDragRef.current = false

    function handleMouseMove(ev) {
      const dxPx = ev.clientX - start.clientX
      const dyPx = ev.clientY - start.clientY
      if (Math.abs(dxPx) > DRAG_THRESHOLD_PX || Math.abs(dyPx) > DRAG_THRESHOLD_PX) {
        didDragRef.current = true
      }
      const dataDx = -(dxPx / rect.width) * start.view.w
      const dataDy = -(dyPx / rect.height) * start.view.h
      setView({ ...start.view, minX: start.view.minX + dataDx, minY: start.view.minY + dataDy })
    }
    function handleMouseUp() {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [view])

  const handleClickCapture = useCallback((e) => {
    if (didDragRef.current) {
      e.stopPropagation()
      didDragRef.current = false
    }
  }, [])

  const viewBox = `${view.minX} ${view.minY} ${view.w} ${view.h}`

  const renderCircle = (s) => {
    const isSelected = s.id === selectedId
    const onHighlightedTrajectory = highlightedTrajectoryId != null && s.trajectory_id === highlightedTrajectoryId
    const isDimmed = highlightedTrajectoryId != null && !onHighlightedTrajectory && !isSelected
    return (
      <circle
        key={s.id}
        cx={s.x}
        cy={s.y}
        r={isSelected ? radius * 1.5 : onHighlightedTrajectory ? radius * 1.2 : radius}
        fill={isDimmed ? 'var(--border-strong)' : colorForCluster(groupIdOf(s))}
        stroke={isSelected ? 'var(--text-primary)' : 'none'}
        strokeWidth={isSelected ? radius * 0.25 : 0}
        opacity={isSelected || onHighlightedTrajectory ? 1 : isDimmed ? 0.35 : 0.75}
        onClick={() => onSelect(s.id)}
        style={{ cursor: 'pointer' }}
      />
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, top: 40, background: 'var(--bg-canvas)' }}>
      <svg
        ref={svgRef}
        viewBox={viewBox}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
        onDoubleClick={() => setView(baseView)}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
      >
        {background.map(renderCircle)}

        {pathPoints && pathPoints.length > 1 && (
          <polyline
            points={pathPoints.map((s) => `${s.x},${s.y}`).join(' ')}
            fill="none"
            stroke={colorForCluster(highlightedTrajectoryId)}
            strokeWidth={pathWidth}
            strokeOpacity={0.85}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        )}

        {foreground.map(renderCircle)}
        {selected && renderCircle(selected)}
      </svg>
      <div style={{
        position: 'absolute', left: '50%', bottom: 12, transform: 'translateX(-50%)',
        fontSize: 10, color: 'var(--text-secondary)',
        background: 'var(--bg-surface)', padding: '4px 8px',
        borderRadius: 6, border: '1px solid var(--border)',
        pointerEvents: 'none',
      }}>
        scroll to zoom · drag to pan · double-click to reset
      </div>
    </div>
  )
}
