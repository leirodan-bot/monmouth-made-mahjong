import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { C, fonts, shadows } from '../theme'
import useFriends from '../useFriends'
import Players from './Players'
import Clubs from './Clubs'

export default function Social({ session, player, initialPlayerId, onClearInitial }) {
  const [view, setView] = useState('players') // 'players' or 'clubs'
  const [search, setSearch] = useState('')
  const { pending, acceptRequest, declineRequest } = useFriends(player?.id, player?.name)
  const [pendingPlayers, setPendingPlayers] = useState([])

  // Resolve pending request player names
  useEffect(() => {
    if (pending.length === 0) { setPendingPlayers([]); return }
    const ids = pending.map(p => p.requester_id)
    supabase.from('players').select('id, name, avatar, elo, town')
      .in('id', ids)
      .then(({ data }) => setPendingPlayers(data || []))
  }, [pending.length])

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif" }}>Community</h2>
        <p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
          Find friends, join clubs, and grow your circle.
        </p>
      </div>

      {/* ══ Friend Requests Banner ══ */}
      {pending.length > 0 && (
        <div style={{
          background: 'white', border: `1.5px solid ${C.jade}`, borderRadius: 14,
          padding: 16, marginBottom: 16, boxShadow: shadows.sm,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: 'rgba(22,101,52,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>👋</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, color: C.midnight }}>
              Friend Request{pending.length > 1 ? 's' : ''} ({pending.length})
            </div>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {pending.map(req => {
              const p = pendingPlayers.find(pl => pl.id === req.requester_id)
              if (!p) return null
              const initials = p.name ? p.name.split(' ').map(n => n[0]).join('') : '?'
              return (
                <div key={req.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  background: C.cloudLt, borderRadius: 12, border: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: C.jade, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: p.avatar ? 16 : 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", flexShrink: 0,
                  }}>{p.avatar || initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.midnight, fontFamily: "'DM Sans', sans-serif" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>{p.town || 'MahjRank player'}</div>
                  </div>
                  <button onClick={() => acceptRequest(req.requester_id)} style={{
                    padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer',
                    background: C.jade, color: 'white',
                  }}>Accept</button>
                  <button onClick={() => declineRequest(req.requester_id)} style={{
                    padding: '8px 12px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                    background: 'white', color: C.slate,
                  }}>✕</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
