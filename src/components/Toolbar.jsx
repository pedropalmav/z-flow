import { useState } from 'react'

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

export function Toolbar({
  metadata, nodeCount,
  theme, onThemeToggle,
  connected, wsUrl, onWsUrlChange, onConnect, onDisconnect,
}) {
  const [showUrlInput, setShowUrlInput] = useState(false)

  function handleConnect() {
    onConnect(wsUrl)
    setShowUrlInput(false)
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

      {/* Connect / Live controls */}
      {connected ? (
        <>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            Live
          </span>
          <button
            style={{ ...btnBase, color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        </>
      ) : showUrlInput ? (
        <>
          <input
            type="text"
            value={wsUrl}
            onChange={(e) => onWsUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConnect()
              if (e.key === 'Escape') setShowUrlInput(false)
            }}
            placeholder="ws://localhost:8765/ws"
            autoFocus
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
              width: 220,
            }}
          />
          <button
            style={{ ...btnBase, fontWeight: 500 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            onClick={handleConnect}
          >
            Go
          </button>
          <button
            style={{ ...btnBase, color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            onClick={() => setShowUrlInput(false)}
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          style={btnBase}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          onClick={() => setShowUrlInput(true)}
        >
          Connect
        </button>
      )}

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
