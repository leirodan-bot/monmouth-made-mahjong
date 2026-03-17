import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function RankBadge({ elo }) {
  let label, bg, color
  if (elo >= 1600) { label = 'Grand Master'; bg = '#1e2b65'; color = '#f0c040' }
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

export default function Players({ session, player }) {
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPlayers() }, [])

  async function fetchPlayers() {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('elo', { ascending: false })
    setPlayers(data || [])
    setLoading(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'sans-serif', color: '#888' }}>Loading players...</div>

  if (selected) return (
    <div>
      <button onClick={() => setSelected(null)} style={{ background: 'none', border: '0.5px solid #c8cdd6', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontFamily: 'sans-serif', color: '#1e2b65', marginBottom: 16, cursor: 'pointer' }}>
        ← Back to players
      </button>
      <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1e2b65', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f4f4f2', fontSize: 20, fontWeight: 700 }}>
            {selected.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1e2b65' }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 2 }}>{selected.town} · {selected.org || 'Unaffiliated'}</div>
            <div style={{ marginTop: 6 }}><RankBadge elo={selected.elo} /></div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#9f1239', fontFamily: 'Playfair Display, serif' }}>{selected.elo}</div>
            <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif' }}>Elo Rating</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Wins', value: selected.wins },
            { label: 'Losses', value: selected.losses },
            { label: 'Games', value: selected.games_played },
            { label: 'Win %', value: selected.games_played > 0 ? `${Math.round((selected.wins / selected.games_played) * 100)}%` : '—' },
          ].map(s => (
            <div key={s.label} style={{ background: '#f4f4f2', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1e2b65' }}>{s.value}</div>
            </div>
          ))}
        </div>
        {selected.current_streak > 1 && (
          <div style={{ marginTop: 12, background: '#fff7ed', border: '0.5px solid #fed7aa', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: 'sans-serif', color: '#92400e' }}>
            🔥 Current win streak: {selected.current_streak} games
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 12, color: '#888', fontFamily: 'sans-serif' }}>
          Member since {new Date(selected.join_date || selected.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e2b65' }}>Player Directory</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>{players.length} registered players · Season 1</p>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {players.map((p, i) => (
          <div key={p.id} onClick={() => setSelected(p)} style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#aaa', minWidth: 24 }}>{i + 1}</div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1e2b65', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f4f4f2', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {p.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e2b65' }}>{p.name} {p.id === player?.id && <span style={{ fontSize: 10, background: '#eef1f8', color: '#1e2b65', padding: '1px 6px', borderRadius: 10, fontFamily: 'sans-serif' }}>You</span>}</div>
              <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginTop: 1 }}>{p.town} · {p.org || 'Unaffiliated'}</div>
            </div>
            <RankBadge elo={p.elo} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#9f1239', fontFamily: 'Playfair Display, serif' }}>{p.elo.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: '#888', fontFamily: 'sans-serif' }}>{p.wins}W–{p.losses}L</div>
            </div>
            {p.current_streak > 1 && <div style={{ fontSize: 11, fontFamily: 'sans-serif' }}>🔥{p.current_streak}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}