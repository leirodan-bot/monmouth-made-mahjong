import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getTier, isProvisional, isInactive } from '../eloUtils'

function RankBadge({ elo }) {
  const tier = getTier(elo)
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 20,
      fontFamily: 'sans-serif', fontWeight: 600,
      background: tier.bg, color: tier.textColor
    }}>
      {tier.name}
    </span>
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

    // Spotlight = top non-provisional, non-inactive player
    if (data && data.length > 0) {
      const eligible = data.find(p =>
        !isProvisional(p.games_played) && !isInactive(p.last_game_date)
      )
      setSpotlight(eligible || data[0])
    }
    setLoading(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'sans-serif', color: '#888' }}>Loading rankings...</div>

  if (players.length === 0) return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e2b65' }}>County Rankings</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>Season 1 · May 2025 – April 2026 · Elo rating system</p>
      </div>
      <div style={{ background: 'white', border: '0.5px dashed #c8cdd6', borderRadius: 12, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: '#888', fontFamily: 'sans-serif' }}>No players yet — be the first to join!</div>
      </div>
    </div>
  )

  // Separate ranked vs provisional
  const rankedPlayers = players.filter(p => !isProvisional(p.games_played))
  const provisionalPlayers = players.filter(p => isProvisional(p.games_played))

  const top3 = rankedPlayers.filter(p => !isInactive(p.last_game_date)).slice(0, 3)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e2b65' }}>County Rankings</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>Season 1 · May 2025 – April 2026 · Elo rating system</p>
      </div>

      {/* Monthly Spotlight */}
      {spotlight && !isProvisional(spotlight.games_played) && (
        <div style={{ background: '#1e2b65', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: '#a0b0c8', fontFamily: 'sans-serif', letterSpacing: '1px', marginBottom: 4 }}>CURRENT LEADER</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>{spotlight.name}</div>
            <div style={{ fontSize: 11, color: '#a0b0c8', fontFamily: 'sans-serif', marginTop: 2 }}>{spotlight.town} · {spotlight.org || 'Unaffiliated'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f0c040' }}>{Math.round(spotlight.elo)}</div>
            <div style={{ fontSize: 10, color: '#a0b0c8', fontFamily: 'sans-serif' }}>Elo Rating</div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {top3.length >= 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[1, 0, 2].map((idx) => {
            const p = top3[idx]
            if (!p) return <div key={idx} />
            const medals = ['🥇', '🥈', '🥉']
            const isGold = idx === 0
            return (
              <div key={p.id} style={{
                background: isGold ? '#fffdf0' : 'white',
                border: isGold ? '1.5px solid #b8860b' : '0.5px solid #c8cdd6',
                borderRadius: 10, padding: 14, textAlign: 'center',
                order: idx === 0 ? 2 : idx === 1 ? 1 : 3
              }}>
                <div style={{ fontSize: 24 }}>{medals[idx]}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e2b65', marginTop: 4 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: '#888', fontFamily: 'sans-serif', marginTop: 2 }}>{p.town}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#9f1239', margin: '6px 0' }}>{Math.round(p.elo).toLocaleString()}</div>
                <RankBadge elo={p.elo} />
                <div style={{ fontSize: 10, color: '#888', fontFamily: 'sans-serif', marginTop: 6 }}>{p.wins}W – {p.losses}L</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full Ranked Table */}
      {rankedPlayers.length > 0 && (
        <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#1e2b65' }}>
                {['#', 'Player', 'Town', 'Club', 'Rank', 'Elo', 'W/L', 'Streak'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', color: '#ffffff', fontSize: 11, fontWeight: 700, textAlign: 'left', fontFamily: 'Playfair Display, serif', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rankedPlayers.map((p, i) => {
                const inactive = isInactive(p.last_game_date)
                return (
                  <tr key={p.id} style={{
                    borderBottom: '0.5px solid #e8e8e4',
                    background: i < 3 && !inactive ? '#fffdf0' : 'white',
                    opacity: inactive ? 0.45 : 1
                  }}>
                    <td style={{ padding: '9px 12px', color: '#888', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#1e2b65' }}>
                      {p.name}
                      {inactive && <span style={{ fontSize: 9, color: '#aaa', marginLeft: 4 }}>INACTIVE</span>}
                    </td>
                    <td style={{ padding: '9px 12px', color: '#555', fontFamily: 'sans-serif' }}>{p.town || '—'}</td>
                    <td style={{ padding: '9px 12px', color: '#555', fontFamily: 'sans-serif' }}>{p.org || '—'}</td>
                    <td style={{ padding: '9px 12px' }}><RankBadge elo={p.elo} /></td>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#9f1239', fontFamily: 'Playfair Display, serif' }}>{Math.round(p.elo).toLocaleString()}</td>
                    <td style={{ padding: '9px 12px', color: '#555', fontFamily: 'sans-serif' }}>{p.wins}–{p.losses}</td>
                    <td style={{ padding: '9px 12px', color: '#555', fontFamily: 'sans-serif' }}>
                      {p.current_streak > 1 ? `🔥 ${p.current_streak}W` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Provisional Players */}
      {provisionalPlayers.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginBottom: 8, letterSpacing: '0.5px' }}>
            PROVISIONAL ({provisionalPlayers.length}) — need 5 games to appear in rankings
          </div>
          <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <tbody>
                {provisionalPlayers.map(p => (
                  <tr key={p.id} style={{ borderBottom: '0.5px solid #e8e8e4' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e2b65' }}>
                      {p.name}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#555', fontFamily: 'sans-serif' }}>{p.town || '—'}</td>
                    <td style={{ padding: '8px 12px', color: '#888', fontFamily: 'sans-serif', textAlign: 'right' }}>
                      {Math.round(p.elo)}? <span style={{ fontSize: 10 }}>({p.games_played}/5 games)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!session && (
        <div style={{ marginTop: 16, background: '#eef1f8', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: '14px 18px', textAlign: 'center', fontFamily: 'sans-serif', fontSize: 13, color: '#1e2b65' }}>
          <strong>Want to appear on this leaderboard?</strong> Sign up to join the league and start recording games.
        </div>
      )}
    </div>
  )
}
