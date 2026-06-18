import { useRef } from 'react'

export function readFileAsJson(file, onLoad) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      onLoad(JSON.parse(e.target.result))
    } catch {
      alert('Invalid JSON file.')
    }
  }
  reader.readAsText(file)
}

const MODES = ['image', 'matrix', 'both']

function Divider() {
  return (
    <div style={{
      width: 1, height: 16,
      background: 'var(--border)',
      flexShrink: 0,
      margin: '0 4px',
    }} />
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

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

export function Toolbar({ metadata, nodeCount, onFileLoad, globalMode, onGlobalModeChange, theme, onThemeToggle }) {
  const inputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) readFileAsJson(file, onFileLoad)
    e.target.value = ''
  }

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
      {/* Logo */}
      <span style={{
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
        paddingRight: 4,
      }}>
        z-flow
      </span>

      <Divider />

      {/* Load JSON */}
      <button
        style={btnBase}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        onClick={() => inputRef.current?.click()}
      >
        Load JSON
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Divider />

      {/* Segmented mode control */}
      <div style={{
        display: 'flex',
        height: 28,
        border: '1px solid var(--border)',
        borderRadius: 6,
        overflow: 'hidden',
      }}>
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => onGlobalModeChange(m)}
            style={{
              ...btnBase,
              height: '100%',
              borderRadius: 0,
              borderRight: m !== 'both' ? '1px solid var(--border)' : 'none',
              background: m === globalMode ? 'var(--bg-surface-hover)' : 'transparent',
              color: m === globalMode ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: m === globalMode ? 500 : 400,
              padding: '0 10px',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Metadata */}
      {metadata && (
        <>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            {metadata.env}
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            · {nodeCount} steps
          </span>
          <Divider />
        </>
      )}

      {/* Theme toggle */}
      <button
        style={{
          ...btnBase,
          padding: '0 8px',
          color: 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-surface-hover)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
        onClick={onThemeToggle}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  )
}
