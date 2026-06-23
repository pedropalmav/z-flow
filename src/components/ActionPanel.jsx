const ACTIONS = [
  { label: 'Turn Left', key: '←', idx: 0 },
  { label: 'Turn Right', key: '→', idx: 1 },
  { label: 'Forward', key: '↑', idx: 2 },
  { label: 'Pickup', key: 'P', idx: 3 },
  { label: 'Drop', key: 'D', idx: 4 },
  { label: 'Toggle', key: 'Space', idx: 5 },
  { label: 'Done', key: '↵', idx: 6 },
]

const panelStyle = {
  position: 'absolute',
  bottom: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 10px',
  background: 'var(--bg-surface)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  whiteSpace: 'nowrap',
}

const actionBtnStyle = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  height: 44,
  minWidth: 56,
  padding: '0 8px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-primary)',
  fontSize: 11,
  fontFamily: 'inherit',
  cursor: 'pointer',
}

const resetBtnStyle = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  height: 44,
  minWidth: 56,
  padding: '0 10px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-primary)',
  fontSize: 11,
  fontFamily: 'inherit',
  cursor: 'pointer',
}

const dividerStyle = {
  width: 1,
  height: 28,
  background: 'var(--border)',
  margin: '0 4px',
  flexShrink: 0,
}

export function ActionPanel({ onAction, onReset }) {
  return (
    <div style={panelStyle}>
      <button
        style={resetBtnStyle}
        onClick={onReset}
        title="Reset episode (clears graph)"
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <span>Reset</span>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>R</span>
      </button>

      <div style={dividerStyle} />

      {ACTIONS.map((a) => (
        <button
          key={a.idx}
          style={actionBtnStyle}
          onClick={() => onAction(a.idx)}
          title={`${a.label} (${a.key})`}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <span>{a.label}</span>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            {a.key}
          </span>
        </button>
      ))}
    </div>
  )
}
