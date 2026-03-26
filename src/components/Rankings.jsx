import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getTier, isProvisional, isInactive } from '../eloUtils'
import { RankingSkeleton } from './Skeleton'
import { C, fonts, shadows, card } from '../theme'

function RankBadge({ elo }) {
  const tier = getTier(elo)
  return (
    <span style={{
      display: 'inline-flex', fontSize: 11, padding: '3px 10px', borderRadius: 20,
      fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
      background: `${tier.color}22`, color: tier.color,
    }}>
      {tier.name}
    </span>
  )
}

function PlayerCard({ player, rank, inactive, onPlayerClick }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px',
      background: rank === 1 && !inactive ? 'rgba(245,158,11,0.02)' : 'white',
      borderBottom: `1px solid ${C.border}`,
      borderLeft: rank === 1 ? `4px solid ${C.gold}` : '4px solid transparent',
      opacity: inactive ? 0.45 : 1,
      cursor: onPlayerClick ? 'pointer' : 'default',
    }} onClick={() => onPlayerClick && onPlayerClick(player.id)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: rank <= 3 ? C.jade : C.cloud,
          color: rank <= 3 ? 'white' : C.slateLt,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
          flexShrink: 0,
        }}>
          {rank}
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: C.jade, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: player.avatar ? 16 : 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
        }}>
          {player.avatar || player.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: onPlayerClick ? C.jade : C.midnight, fontFamily: "'Outfit', sans-serif" }}>
              {player.name}
            </span>
            <RankBadge elo={player.elo} />
            {inactive && <span style={{ fontSize: 9, color: C.slateMd, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>INACTIVE</span>}
          </div>
          <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{player.town || '—'}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.crimson, fontFamily: "'JetBrains Mono', monospace" }}>
          {Math.round(player.elo)}
        </div>
        <div style={{ fontSize: 10, color: C.slateMd, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
          {player.wins}W–{player.losses}L
          {player.current_streak > 1 && <span> · 🔥{player.current_streak}</span>}
        </div>
      </div>
    </div>
  )
}

export default function Rankings({ session, player, onPlayerClick }) {
  const [players, setPlayers] = useState([])
  const [view, setView] = useState('global') // 'global', 'circle', 'club'
  const [timeRange, setTimeRange] = useState('season')
  const [followedIds, setFollowedIds] = useState([])
  const [clubMemberIds, setClubMemberIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [spotlight, setSpotlight] = useState(null)

  useEffect(() => { fetchPlayers() }, [])
  // Fetch follows and club members for filtering
  useEffect(() => {
    if (!player?.id) return
    supabase.from('follows').select('following_id').eq('follower_id', player.id)
      .then(({ data }) => setFollowedIds((data || []).map(f => f.following_id)))
    // Get clubs this player belongs to, then get all members of those clubs
    supabase.from('club_members').select('club_id').eq('player_id', player.id).eq('status', 'approved')
      .then(({ data }) => {
        if (!data?.length) return
        const clubIds = data.map(d => d.club_id)
        supabase.from('club_members').select('player_id').in('club_id', clubIds).eq('status', 'approved')
          .then(({ data: members }) => setClubMemberIds((members || []).map(m => m.player_id)))
      })
  }, [player?.id])

  async function fetchPlayers() {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('elo', { ascending: false })
    setPlayers(data || [])

    if (data && data.length > 0) {
      const eligible = data.find(p =>
        !isProvisional(p.games_played) && !isInactive(p.last_game_date)
      )
      setSpotlight(eligible || data[0])
    }
    setLoading(false)
  }

  if (loading) return <RankingSkeleton />

  if (players.length === 0) return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight }}>Rankings</h2>
        <p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>Season 1 · May 2025 – April 2026 · Elo rating system</p>
      </div>
      <div style={{ background: 'white', border: `1px dashed ${C.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>No players yet — be the first to join!</div>
      </div>
    </div>
  )

  // Apply view filter first
  const viewFiltered = view === 'circle'
    ? players.filter(p => followedIds.includes(p.id) || p.id === player?.id)
    : view === 'club'
    ? players.filter(p => clubMemberIds.includes(p.id) || p.id === player?.id)
    : players
  const rankedPlayers = viewFiltered.filter(p => !isProvisional(p.games_played))
  const provisionalPlayers = viewFiltered.filter(p => isProvisional(p.games_played))
  const top3 = rankedPlayers.filter(p => !isInactive(p.last_game_date)).slice(0, 3)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight }}>Rankings</h2>
          <p style={{ fontSize: 12, color: C.slate, fontFamily: "'JetBrains Mono', monospace", marginTop: 4, letterSpacing: 0.3 }}>Season 1 · May 2025 – April 2026</p>
        </div>
        <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
          {[{ key: 'season', label: 'Season' }, { key: 'alltime', label: 'All-Time' }].map(t => (
            <button key={t.key} onClick={() => setTimeRange(t.key)} style={{
              padding: '6px 16px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer',
              background: timeRange === t.key ? C.midnight : C.white, color: timeRange === t.key ? '#fff' : C.slate,
              border: 'none',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* View toggle: Global / Friends / Club */}
      {player && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {[{ key: 'global', label: 'Global' }, { key: 'circle', label: 'Friends' }, { key: 'club', label: 'My Club' }].map(v => (
            <button key={v.key} onClick={() => setView(v.key)} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer',
              background: view === v.key ? C.midnight : 'white', color: view === v.key ? C.cloud : C.slate,
              border: view === v.key ? 'none' : '1px solid ' + C.border
            }}>{v.label}</button>
          ))}
        </div>
      )}

      {/* Current Leader Spotlight */}
      {spotlight && !isProvisional(spotlight.games_played) && (
        <div style={{
          background: 'white',
          border: `1px solid ${C.border}`,
          borderLeft: `4px solid ${C.jade}`,
          borderRadius: 14,
          padding: '16px 18px',
          boxShadow: shadows.md,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, color: C.jade, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', marginBottom: 4, fontWeight: 600 }}>CURRENT LEADER</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif" }}>{spotlight.name}</div>
            <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{spotlight.town}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.crimson, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(spotlight.elo)}</div>
            <div style={{ fontSize: 10, color: C.slateMd, fontFamily: "'DM Sans', sans-serif" }}>Elo Rating</div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {top3.length >= 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[1, 0, 2].map((idx) => {
            const p = top3[idx]
            if (!p) return <div key={idx} />
            const medals = ['🥇', '🥈', '🥉']
            const isGold = idx === 0
            return (
              <div key={p.id} onClick={() => session && onPlayerClick && onPlayerClick(p.id)} style={{
                background: isGold ? 'rgba(245,158,11,0.04)' : 'white',
                border: isGold ? `1.5px solid ${C.gold}` : `1px solid ${C.border}`,
                borderRadius: 12, padding: '12px 8px', textAlign: 'center',
                order: idx === 0 ? 2 : idx === 1 ? 1 : 3,
                cursor: session ? 'pointer' : 'default',
              }}>
                <div style={{ fontSize: 22 }}>{medals[idx]}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: session ? C.jade : C.midnight, fontFamily: "'Outfit', sans-serif", marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: 9, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.town}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.crimson, fontFamily: "'JetBrains Mono', monospace", margin: '4px 0' }}>{Math.round(p.elo)}</div>
                <RankBadge elo={p.elo} />
                <div style={{ fontSize: 9, color: C.slateMd, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>{p.wins}W – {p.losses}L</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Ranked Players — Card Layout */}
      {rankedPlayers.length > 0 && (
        <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
          {/* Column headers */}
          <div style={{
            display: 'flex', alignItems: 'center', padding: '8px 14px',
            borderBottom: `1px solid ${C.border}`, background: C.cloud,
          }}>
            <span style={{ width: 38, fontSize: 10, fontWeight: 600, color: C.slateLt, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'JetBrains Mono', monospace" }}>#</span>
            <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: C.slateLt, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'JetBrains Mono', monospace" }}>Player</span>
            <span style={{ width: 60, fontSize: 10, fontWeight: 600, color: C.slateLt, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center' }}>Tier</span>
            <span style={{ width: 60, fontSize: 10, fontWeight: 600, color: C.slateLt, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' }}>W – L</span>
            <span style={{ width: 50, fontSize: 10, fontWeight: 600, color: C.slateLt, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' }}>Elo</span>
          </div>
          {rankedPlayers.map((p, i) => (
            <PlayerCard
              key={p.id}
              player={p}
              rank={i + 1}
              inactive={isInactive(p.last_game_date)}
              onPlayerClick={session ? onPlayerClick : undefined}
            />
          ))}
        </div>
      )}

      {/* Provisional Players */}
      {provisionalPlayers.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: C.slateMd, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, letterSpacing: '1px', fontWeight: 600 }}>
            PROVISIONAL ({provisionalPlayers.length}) — need 5 games to rank
          </div>
          <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {provisionalPlayers.map(p => (
              <div key={p.id} onClick={() => session && onPlayerClick && onPlayerClick(p.id)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
                cursor: session ? 'pointer' : 'default',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: session ? C.jade : C.midnight, fontFamily: "'Outfit', sans-serif" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>{p.town || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.slateMd, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(p.elo)}?</div>
                  <div style={{ fontSize: 10, color: C.slateMd, fontFamily: "'DM Sans', sans-serif" }}>{p.games_played}/5 games</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!session && (
        <div style={{ marginTop: 16, background: 'rgba(22,101,52,0.04)', border: `1px solid rgba(22,101,52,0.12)`, borderRadius: 12, padding: '14px 18px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.midnight }}>
          <strong>Want to appear on this leaderboard?</strong> Sign up to start tracking your Mahjong rating.
        </div>
      )}
    </div>
  )
}