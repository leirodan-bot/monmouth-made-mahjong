import { useState } from 'react'
import { C, fonts, shadows } from '../theme'
import Players from './Players'
import Clubs from './Clubs'

export default function Social({ session, player, initialPlayerId, onClearInitial }) {
  const [view, setView] = useState('players') // 'players' or 'clubs'
  const [search, setSearch] = useState('')

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif" }}>Community</h2>
        <p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
          Find friends, join clubs, and grow your circle.
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={C.slate} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={view === 'players' ? 'Search players by name or town...' : 'Search clubs...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 44px',
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            background: C.white,
            fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            color: C.midnight,
            boxShadow: shadows.sm,
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = C.jade; e.target.style.boxShadow = `0 0 0 3px rgba(22,101,52,0.08)` }}
          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = shadows.sm }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: C.cloud, border: 'none', borderRadius: '50%',
              width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 12, color: C.slate, padding: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Players / Clubs Toggle */}
      <div style={{
        display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden',
        border: `1.5px solid ${C.border}`, marginBottom: 20,
      }}>
        {[
          { key: 'players', label: 'Players', icon: '👥' },
          { key: 'clubs', label: 'Clubs', icon: '🏘️' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setView(t.key); setSearch('') }}
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              cursor: 'pointer',
              background: view === t.key ? C.midnight : C.white,
              color: view === t.key ? '#fff' : C.slate,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: 15 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === 'players' ? (
        <Players
          session={session}
          player={player}
          initialPlayerId={initialPlayerId}
          onClearInitial={onClearInitial}
          searchFilter={search}
        />
      ) : (
        <Clubs
          session={session}
          player={player}
          searchFilter={search}
        />
      )}
    </div>
  )
}
