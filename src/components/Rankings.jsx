import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getTier, isProvisional, isInactive } from '../eloUtils'

const C = {
  jade: '#065F46',
  jadeLt: '#059669',
  crimson: '#DC2626',
  gold: '#F59E0B',
  goldDk: '#D97706',
  midnight: '#0F172A',
  ink: '#1E293B',
  cloud: '#F8FAFC',
  slate: '#64748B',
  slateLt: '#94A3B8',
  border: '#E2E8F0',
}

function RankBadge({ elo }) {
  const tier = getTier(elo)
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 20,
      fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
      background: tier.bg, color: tier.textColor
    }}>
      {tier.name}
    </span>
  )
}

function PlayerCard({ player, rank, inactive }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px',
      background: rank <= 3 && !inactive ? 'rgba(245,158,11,0.04)' : 'white',
      borderBottom: `1px solid ${C.border}`,
      opacity: inactive ? 0.45 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif" }}>
            {player.name}
            {inactive && <span style={{ fontSize: 9, color: C.slateLt, marginLeft: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>INACTIVE</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>{player.town || '—'}</span>
            <RankBadge elo={player.elo} />
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.crimson, fontFamily: "'JetBrains Mono', monospace" }}>
          {Math.round(player.elo)}
        </div>
        <div style={{ fontSize: 10, color: C.slateLt, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
          {player.wins}W–{player.losses}L
          {player.current_streak > 1 && <span> · 🔥{player.current_streak}</span>}
        </div>
      </div>
    </div>
  )
}

export default function Rankings({ session }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [spotlight, setSpotlight] = useState(null)

  useEffect(() => { fetchPlayers() }, [])

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

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: "'DM Sans', sans-serif", color: C.slate }}>Loading rankings...</div>

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

  const rankedPlayers = players.filter(p => !isProvisional(p.games_played))
  const provisionalPlayers = players.filter(p => isProvisional(p.games_played))
  const top3 = rankedPlayers.filter(p => !isInactive(p.last_game_date)).slice(0, 3)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight }}>Rankings</h2>
        <p style={{ fontSize: 12, color: C.slate, fontFamily: "'JetBrains Mono', monospace", marginTop: 4, letterSpacing: 0.3 }}>Season 1 · May 2025 – April 2026</p>
      </div>

      {/* Current Leader Spotlight */}
      {spotlight && !isProvisional(spotlight.games_played) && (
        <div style={{
          background: C.cloud,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: '16px 18px',
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
            <div style={{ fontSize: 10, color: C.slateLt, fontFamily: "'DM Sans', sans-serif" }}>Elo Rating</div>
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
              <div key={p.id} style={{
                background: isGold ? 'rgba(245,158,11,0.04)' : 'white',
                border: isGold ? `1.5px solid ${C.gold}` : `1px solid ${C.border}`,
                borderRadius: 12, padding: '12px 8px', textAlign: 'center',
                order: idx === 0 ? 2 : idx === 1 ? 1 : 3
              }}>
                <div style={{ fontSize: 22 }}>{medals[idx]}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif", marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: 9, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.town}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.crimson, fontFamily: "'JetBrains Mono', monospace", margin: '4px 0' }}>{Math.round(p.elo)}</div>
                <RankBadge elo={p.elo} />
                <div style={{ fontSize: 9, color: C.slateLt, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>{p.wins}W – {p.losses}L</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Ranked Players — Card Layout */}
      {rankedPlayers.length > 0 && (
        <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
          {rankedPlayers.map((p, i) => (
            <PlayerCard
              key={p.id}
              player={p}
              rank={i + 1}
              inactive={isInactive(p.last_game_date)}
            />
          ))}
        </div>
      )}

      {/* Provisional Players */}
      {provisionalPlayers.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: C.slateLt, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, letterSpacing: '1px', fontWeight: 600 }}>
            PROVISIONAL ({provisionalPlayers.length}) — need 5 games to rank
          </div>
          <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {provisionalPlayers.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.midnight, fontFamily: "'Outfit', sans-serif" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>{p.town || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.slateLt, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(p.elo)}?</div>
                  <div style={{ fontSize: 10, color: C.slateLt, fontFamily: "'DM Sans', sans-serif" }}>{p.games_played}/5 games</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!session && (
        <div style={{ marginTop: 16, background: 'rgba(6,95,70,0.04)', border: `1px solid rgba(6,95,70,0.12)`, borderRadius: 12, padding: '14px 18px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.midnight }}>
          <strong>Want to appear on this leaderboard?</strong> Sign up to start tracking your Mahjong rating.
        </div>
      )}
    </div>
  )
}