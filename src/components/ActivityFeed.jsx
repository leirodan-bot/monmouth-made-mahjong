import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getBadge } from '../badgeUtils'
import { ActivitySkeleton } from './Skeleton'

const C = {
  jade: '#065F46', jadeLt: '#059669', jadePale: '#ECFDF5',
  crimson: '#DC2626', crimsonLt: '#EF4444', crimsonPale: '#FEF2F2',
  gold: '#F59E0B', goldDk: '#D97706', goldPale: '#FFFBEB',
  midnight: '#0F172A', ink: '#1E293B',
  cloud: '#F8FAFC', white: '#FFFFFF',
  slate: '#64748B', slateLt: '#94A3B8', slateXlt: '#CBD5E1',
  border: '#E2E8F0', borderLt: '#F1F5F9',
}

export default function ActivityFeed({ player }) {
  const [items, setItems] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [followedIds, setFollowedIds] = useState([])
  const [clubMemberIds, setClubMemberIds] = useState([])
  const [forYouItems, setForYouItems] = useState([])

  useEffect(() => { fetchActivity() }, [])

  async function fetchActivity() {
    const { data: playerData } = await supabase.from('players').select('id, name')
    setPlayers(playerData || [])
    // Fetch who this player follows for "My Circle" filter
    if (player?.id) {
      const { data: followData } = await supabase.from('follows').select('following_id').eq('follower_id', player.id)
      setFollowedIds((followData || []).map(f => f.following_id))
      // Also fetch club members for "My Club" filter
      const { data: myClubs } = await supabase.from('club_members').select('club_id').eq('player_id', player.id).eq('status', 'approved')
      if (myClubs?.length) {
        const clubIds = myClubs.map(c => c.club_id)
        const { data: members } = await supabase.from('club_members').select('player_id').in('club_id', clubIds).eq('status', 'approved')
        setClubMemberIds((members || []).map(m => m.player_id))
      }
    }
    // Fetch personal notifications for "For You" tab
    if (player?.id) {
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('player_id', player.id)
        .order('read', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(50)
      setForYouItems((notifs || []).map(n => ({
        id: `notif-${n.id}`, notifId: n.id, type: 'notification',
        time: new Date(n.created_at), icon: n.type === 'confirm_match' ? '🀄' : n.type === 'verified' ? '✓' : n.type === 'follow' ? '👤' : '🔔',
        title: n.message, read: n.read, notifType: n.type,
        isPending: n.type === 'confirm_match' && !n.read,
      })))
    }
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
        allItems.push({ id: `badge-${b.id}`, type: 'badge', time: new Date(b.earned_at), icon: badge.emoji, title: `${p.name} earned "${badge.name}"`, detail: badge.desc, playerId: b.player_id })
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

  async function markNotifRead(notifId, itemId) {
    try {
      await supabase.rpc('mark_notification_read', { p_notification_id: notifId, p_player_id: player.id })
      setForYouItems(prev => prev.map(i => i.id === itemId ? { ...i, read: true } : i))
    } catch (e) { console.error('Mark read failed:', e) }
  }

  const filtered = filter === 'foryou' ? forYouItems
    : filter === 'all' ? items
    : filter === 'circle' ? items.filter(i => {
      // Show items involving players you follow
      if (i.eloUpdates) return i.eloUpdates.some(u => followedIds.includes(u.id))
      if (i.playerId) return followedIds.includes(i.playerId)
      return false
    })
    : filter === 'club' ? items.filter(i => {
      // Show items involving club members
      if (i.eloUpdates) return i.eloUpdates.some(u => clubMemberIds.includes(u.id))
      if (i.playerId) return clubMemberIds.includes(i.playerId)
      return false
    })
    : items.filter(i => i.type === filter)

  if (loading) return <ActivitySkeleton />

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight }}>Activity Feed</h2>
            <button onClick={async () => { try { await supabase.rpc("mark_notifications_read", { p_player_id: player.id }); } catch(e) {} }} style={{ background: "none", border: "none", fontSize: 12, color: C.crimson, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Mark all read</button>
          </div>
        <p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>Recent games, badges, and community updates</p>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{ key: 'all', label: 'All' }, { key: 'foryou', label: 'For You' }, { key: 'circle', label: 'My Circle' }, { key: 'club', label: 'My Club' }, { key: 'game', label: 'Games' }, { key: 'badge', label: 'Badges' }].map(f => (
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
            <div key={item.id} onClick={() => {
              if (filter === 'foryou' && !item.read && item.notifId) markNotifRead(item.notifId, item.id)
            }} style={{
              display: 'flex', gap: 12, padding: '14px 16px',
              borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
              borderLeft: item.type === 'badge' ? `4px solid ${C.gold}`
                : item.icon === '🧱' ? `4px solid ${C.slateLt}`
                : item.isPending ? `4px solid ${C.goldDk}`
                : item.status === 'Verified' || item.status === 'Auto-verified' ? `4px solid ${C.jade}`
                : '4px solid transparent',
              cursor: filter === 'foryou' && !item.read ? 'pointer' : 'default',
              background: filter === 'foryou' && !item.read ? 'rgba(6,95,70,0.02)' : 'transparent',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: item.type === 'badge' ? 'rgba(245,158,11,0.08)' : item.isPending ? 'rgba(245,158,11,0.06)' : 'rgba(6,95,70,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
              }}>{item.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.midnight, lineHeight: 1.4 }}>{item.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: C.slateLt, fontFamily: "'DM Sans', sans-serif" }}>{timeAgo(item.time)}</div>
                    {filter === 'foryou' && !item.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.crimson, flexShrink: 0 }} />}
                  </div>
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
                      <span key={u.id} style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: u.delta > 0 ? C.jade : u.delta < 0 ? C.crimson : C.slateLt }}>
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
