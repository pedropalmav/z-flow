import { useState, useEffect } from 'react'
import { MatrixCanvas, CELL_W, CELL_H } from './MatrixCanvas'
import { rowMatches, argmaxIndex } from '../lib/similarity'

const CANVAS_HEIGHT = 320

// Grid-positioned explicitly (rather than stacked in flex order) so the diff
// strip's row always starts at the same y as the heatmap row, regardless of
// how tall the label/image rows above it are.
function RowDiffStrip({ matches, activeRow, onHoverRow, onClickRow }) {
  return (
    <div style={{
      gridColumn: 2, gridRow: 3, alignSelf: 'start',
      display: 'flex', flexDirection: 'column',
      width: 14, height: CANVAS_HEIGHT,
      borderRadius: 3, overflow: 'hidden',
      border: '1px solid var(--border)',
    }}>
      {matches.map((m, i) => (
        <div
          key={i}
          onMouseEnter={() => onHoverRow(i)}
          onMouseLeave={() => onHoverRow(null)}
          onClick={() => onClickRow(i)}
          style={{
            flex: 1,
            background: m ? '#22c55e' : '#ef4444',
            border: i === activeRow ? '2px solid #fff' : 'none',
            boxSizing: 'border-box',
            cursor: 'pointer',
          }}
        />
      ))}
    </div>
  )
}

function StateColumn({ column, label, image, stoch, canvasWidth, activeRow, totalRows }) {
  return (
    <>
      <span style={{
        gridColumn: column, gridRow: 1, textAlign: 'center',
        fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)',
      }}>
        {label}
      </span>
      <div style={{ gridColumn: column, gridRow: 2 }}>
        {image && (
          <img
            src={`data:image/png;base64,${image}`}
            alt="observation"
            draggable={false}
            style={{ width: canvasWidth, borderRadius: 6, display: 'block' }}
          />
        )}
      </div>
      <div style={{ gridColumn: column, gridRow: 3, alignSelf: 'start', position: 'relative' }}>
        <MatrixCanvas stoch={stoch} style={{ width: canvasWidth, height: CANVAS_HEIGHT }} />
        {activeRow !== null && activeRow > 0 && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 0,
            height: `${(activeRow / totalRows) * 100}%`,
            background: 'var(--bg-surface)', opacity: 0.7,
            pointerEvents: 'none',
          }} />
        )}
        {activeRow !== null && activeRow < totalRows - 1 && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            top: `${((activeRow + 1) / totalRows) * 100}%`,
            background: 'var(--bg-surface)', opacity: 0.7,
            pointerEvents: 'none',
          }} />
        )}
      </div>
    </>
  )
}

// Plain, view-agnostic state shape so this panel can compare states coming
// from either the live trajectory graph (ReactFlow nodes) or the cluster
// explorer (REST detail responses) — callers adapt their own shape to
// { id, image_b64, stoch, label } before passing it in.
export function ComparisonPanel({ stateA, stateB, onClose }) {
  const [hoveredRow, setHoveredRow] = useState(null)
  const [clickedRow, setClickedRow] = useState(null)

  // Reset row highlight state when the compared pair changes.
  useEffect(() => {
    setHoveredRow(null)
    setClickedRow(null)
  }, [stateA?.id, stateB?.id])

  if (!stateA || !stateB) return null

  const stochA = stateA.stoch
  const stochB = stateB.stoch
  const matches = rowMatches(stochA, stochB)
  const similarity = matches.length ? matches.filter(Boolean).length / matches.length : 0
  const cols = stochA?.[0]?.length ?? 0
  const rows = stochA?.length ?? 1
  const canvasWidth = (CANVAS_HEIGHT * cols * CELL_W) / (rows * CELL_H)
  // A click locks the highlight and ignores hover until clicked again.
  const activeRow = clickedRow ?? hoveredRow
  const handleClickRow = (i) => setClickedRow((prev) => prev === i ? null : i)
  const colA = activeRow !== null ? argmaxIndex(stochA[activeRow]) : null
  const colB = activeRow !== null ? argmaxIndex(stochB[activeRow]) : null

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, zIndex: 29, background: 'rgba(0,0,0,0.5)' }}
      />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 30,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        fontFamily: 'inherit',
        maxHeight: '85vh',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Compare states</span>
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

        <div style={{ textAlign: 'center', padding: '14px 16px 4px' }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'rgb(217, 70, 239)' }}>
            {Math.round(similarity * 100)}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {matches.filter(Boolean).length} / {matches.length} rows match
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `${canvasWidth}px 14px ${canvasWidth}px`,
          rowGap: 6, columnGap: 16,
          justifyContent: 'center',
          padding: '12px 20px 16px',
        }}>
          <StateColumn column={1} label={stateA.label} image={stateA.image_b64} stoch={stochA} canvasWidth={canvasWidth} activeRow={activeRow} totalRows={rows} />
          <RowDiffStrip matches={matches} activeRow={activeRow} onHoverRow={setHoveredRow} onClickRow={handleClickRow} />
          <StateColumn column={3} label={stateB.label} image={stateB.image_b64} stoch={stochB} canvasWidth={canvasWidth} activeRow={activeRow} totalRows={rows} />

          <div style={{
            gridColumn: 1, gridRow: 4, minWidth: 0, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            whiteSpace: 'nowrap', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)',
          }}>
            {activeRow !== null ? <>column <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{colA}</span></> : '—'}
          </div>
          <div style={{
            gridColumn: 2, gridRow: 4, minWidth: 0, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            whiteSpace: 'nowrap', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)',
          }}>
            {activeRow !== null ? `row ${activeRow}` : '—'}
          </div>
          <div style={{
            gridColumn: 3, gridRow: 4, minWidth: 0, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            whiteSpace: 'nowrap', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)',
          }}>
            {activeRow !== null ? <>column <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{colB}</span></> : '—'}
          </div>
        </div>
      </div>
    </>
  )
}
