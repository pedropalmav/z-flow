import { SunIcon, MoonIcon } from './Toolbar'

function HomeCard({ title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
        width: 280, padding: '24px 20px',
        border: '1px solid var(--border)', borderRadius: 12,
        background: 'var(--bg-surface)',
        cursor: 'pointer', textAlign: 'left',
        fontFamily: 'inherit',
        transition: 'border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</span>
    </button>
  )
}

export function HomePage({ theme, onThemeToggle, onSelect }) {
  return (
    <div style={{
      position: 'relative', width: '100vw', height: '100vh',
      background: 'var(--bg-canvas)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 32,
    }}>
      <button
        onClick={onThemeToggle}
        style={{
          position: 'absolute', top: 16, right: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, border: 'none', borderRadius: 6,
          background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
        z-flow
      </span>

      <div style={{ display: 'flex', gap: 16 }}>
        <HomeCard
          title="Trajectory Builder"
          description="Step through an episode action by action against a live backend. Inspect each visited state's image and z, and compare any two states."
          onClick={() => onSelect('live')}
        />
        <HomeCard
          title="Cluster Explorer"
          description="Collect random-policy trajectories, cluster the visited states by their z, and browse or compare states across clusters and episodes."
          onClick={() => onSelect('clusters')}
        />
      </div>
    </div>
  )
}
