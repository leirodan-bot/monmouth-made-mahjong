import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getBadge } from '../badgeUtils'

const C = {
  jade: '#065F46', jadeLt: '#059669', crimson: '#DC2626', gold: '#F59E0B', goldDk: '#D97706',
  midnight: '#0F172A', ink: '#1E293B', cloud: '#F8FAFC', slate: '#64748B', slateLt: '#94A3B8', border: '#E2E8F0',
}

export default function ActivityFeed({ player }) {
  const [items, setItems] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchActivity() }, [])

  async function fetchActivity() {
    const { data: playerData } = await supabase.from('players').select('id, name')
    setPlayers(playerData || [])
    const allItems = []
    const { data: matches } = await supabase.from('matches').select('*').order('played_at', { ascending: false }).limit(50)
    if (matches) {
      for (const m of matches) {
        const submitter = playerData?.find(p => p.id === m.submitted_by)
        const winnerP = playerData?.find(p => p.id === m.winner_id)
        const statusLabel = m.status === 'confirmed' ? 'Verified' : m.status === 'auto-verified' ? 'Auto-verified' : m.status === 'disputed' ? 'Disputed' : 'Pending'
        const statusColor = m.status === 'confirmed' ? C.jade : m.status === 'auto-verified' ? '#2563eb' : m.status === 'disputed' ? C.crimson : C.goldDk
        allItems.push({
          id: `match-${m.id}`, type: 'game', time: new Date(m.played_at),
          icon: m.is_wall_game ? '🧱' : '🀄',
          title: m.is_wall_game ? `${submitter?.name || 'Someone'} recorded a wall game` : `${winnerP?.name || 'Unknown'} won a game`,
          detail: [m.hand_section ? `${m.hand_section}` : null, m.jokerless ? 'Jokerless' : null, m.win_method === 'self_pick' ? 'From the wall' : null].filter(Boolean).join(' · ') || null,
          status: statusLabel, statusColor, eloUpdates: m.elo_updates, isPending: m.status === 'pending',
        })
      }
    }
    const { data: badges } = await supabase.from('player_badges').select('*').order('earned_at', { ascending: false }).limit(30)
    if (badges) {
      for (const b of badges) {
        const badge = getBadge(b.badge_id)
        const p = playerData?.find(pl => pl.id === b.player_id)
        if (!badge || !p) continue
        allItems.push({ id: `badge-${b.id}`, type: 'badge', time: new Date(b.earned_at), icon: badge.emoji, title: `${p.name} earned "${badge.name}"`, detail: badge.desc })
      }
    }
    allItems.sort((a, b) => b.time - a.time)
    setItems(allItems)
    setLoading(false)
  }

  function getName(id) { return players.find(p => p.id === id)?.name || 'Unknown' }
  function timeAgo(date) {
    const diff = Math.floor((new Date() - date) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: "'DM Sans', sans-serif", color: C.slate }}>Loading activity...</div>

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight }}>Activity Feed</h2>
        <p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>Recent games, badges, and community updates</p>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{ key: 'all', label: 'All' }, { key: 'game', label: 'Games' }, { key: 'badge', label: 'Badges' }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer',
            background: filter === f.key ? C.midnight : 'white', color: filter === f.key ? C.cloud : C.slate,
            border: filter === f.key ? 'none' : `1px solid ${C.border}`
          }}>{f.label}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div style={{ background: 'white', border: `1px dashed ${C.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>No activity yet. Games and badges will appear here.</div>
        </div>
      ) : (
        <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map((item, i) => (
            <div key={item.id} style={{
              display: 'flex', gap: 12, padding: '14px 16px',
              borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
              borderLeft: item.type === 'badge' ? `4px solid ${C.gold}` : item.isPending ? `4px solid ${C.goldDk}` : item.status === 'Verified' || item.status === 'Auto-verified' ? `4px solid ${C.jade}` : '4px solid transparent',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: item.type === 'badge' ? 'rgba(245,158,11,0.08)' : item.isPending ? 'rgba(245,158,11,0.06)' : 'rgba(6,95,70,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
              }}>{item.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.midnight, lineHeight: 1.4 }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: C.slateLt, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>{timeAgo(item.time)}</div>
                </div>
                {item.detail && <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 3, lineHeight: 1.4 }}>{item.detail}</div>}
                {item.status && (
                  <div style={{ marginTop: 6 }}>
                    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: 6, background: item.statusColor + '12', color: item.statusColor, letterSpacing: 0.3 }}>{item.status}</span>
                  </div>
                )}
                {item.eloUpdates && (item.status === 'Verified' || item.status === 'Auto-verified') && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {item.eloUpdates.map(u => (
                      <span key={u.id} style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: u.delta > 0 ? C.jade : u.delta < 0 ? C.crimson : C.slateLt }}>
                        {getName(u.id)} {u.delta > 0 ? '+' : ''}{u.delta.toFixed(1)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
