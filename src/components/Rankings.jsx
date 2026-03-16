import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function RankBadge({ elo }) {
  let label, bg, color
  if (elo >= 1600) { label = 'Grand Master'; bg = '#1a2744'; color = '#f0c040' }
  else if (elo >= 1300) { label = 'Master'; bg = '#9f1239'; color = 'white' }
  else if (elo >= 1000) { label = 'Expert'; bg = '#2d6a8f'; color = 'white' }
  else if (elo >= 700) { label = 'Skilled'; bg = '#2d7a4f'; color = 'white' }
  else { label = 'Novice'; bg = '#6b7280'; color = 'white' }
  return (
    <span style={{ display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontFamily: 'sans-serif', fontWeight: 600, background: bg, color }}>
      {label}
    </span>
  )
}

export default function Rankings({ session }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [spotlight, setSpotlight] = useState(null)

  useEffect(() => {
    fetchPlayers()
  }, [])

  async function fetchPlayers() {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('elo', { ascending: false })
    setPlayers(data || [])
    if (data && data.length > 0) setSpotlight(data[0])
    setLoading(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'sans-serif', color: '#888' }}>Loading rankings...</div>

  if (players.length === 0) return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2744' }}>County Rankings</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>Season 1 · May 2025 – April 2026 · Elo rating system</p>
      </div>
      <div style={{ background: 'white', border: '0.5px dashed #c8cdd6', borderRadius: 12, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: '#888', fontFamily: 'sans-serif' }}>No players yet — be the first to join!</div>
      </div>
    </div>
  )

  const top3 = players.slice(0, 3)
  const rest = players.slice(3)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2744' }}>County Rankings</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>Season 1 · May 2025 – April 2026 · Elo rating system</p>
      </div>

      {/* Monthly Spotlight */}
      {spotlight && (
        <div style={{ background: '#1a2744', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: '#a0b0c8', fontFamily: 'sans-serif', letterSpacing: '1px', marginBottom: 4 }}>CURRENT LEADER</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>{spotlight.name}</div>
            <div style={{ fontSize: 11, color: '#a0b0c8', fontFamily: 'sans-serif', marginTop: 2 }}>{spotlight.town} · {spotlight.org || 'Unaffiliated'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f0c040' }}>{spotlight.elo}</div>
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
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginTop: 4 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: '#888', fontFamily: 'sans-serif', marginTop: 2 }}>{p.town}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#9f1239', margin: '6px 0' }}>{p.elo.toLocaleString()}</div>
                <RankBadge elo={p.elo} />
                <div style={{ fontSize: 10, color: '#888', fontFamily: 'sans-serif', marginTop: 6 }}>{p.wins}W – {p.losses}L</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full Table */}
      <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#1a2744' }}>
              {['#', 'Player', 'Town', 'Club', 'Rank', 'Elo', 'W/L', 'Streak'].map(h => (
                <th key={h} style={{ padding: '9px 12px', color: '#ffffff', fontSize: 11, fontWeight: 700, textAlign: 'left', fontFamily: 'Playfair Display, serif', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: '0.5px solid #e8e8e4', background: i < 3 ? '#fffdf0' : 'white' }}>
                <td style={{ padding: '9px 12px', color: '#888', fontWeight: 700 }}>{i + 1}</td>
                <td style={{ padding: '9px 12px', fontWeight: 700, color: '#1a2744' }}>{p.name}</td>
                <td style={{ padding: '9px 12px', color: '#555', fontFamily: 'sans-serif' }}>{p.town || '—'}</td>
                <td style={{ padding: '9px 12px', color: '#555', fontFamily: 'sans-serif' }}>{p.org || '—'}</td>
                <td style={{ padding: '9px 12px' }}><RankBadge elo={p.elo} /></td>
                <td style={{ padding: '9px 12px', fontWeight: 700, color: '#9f1239', fontFamily: 'Playfair Display, serif' }}>{p.elo.toLocaleString()}</td>
                <td style={{ padding: '9px 12px', color: '#555', fontFamily: 'sans-serif' }}>{p.wins}–{p.losses}</td>
                <td style={{ padding: '9px 12px', color: '#555', fontFamily: 'sans-serif' }}>
                  {p.current_streak > 1 ? `🔥 ${p.current_streak}W` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!session && (
        <div style={{ marginTop: 16, background: '#eef1f8', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: '14px 18px', textAlign: 'center', fontFamily: 'sans-serif', fontSize: 13, color: '#1a2744' }}>
          <strong>Want to appear on this leaderboard?</strong> Sign up to join the league and start recording matches.
        </div>
      )}
    </div>
  )
}