import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Towns() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPlayers() }, [])

  async function fetchPlayers() {
    const { data } = await supabase.from('players').select('town, elo, games_played')
    setPlayers(data || [])
    setLoading(false)
  }

  // Group by town dynamically instead of hardcoded list
  const townMap = {}
  players.forEach(p => {
    if (!p.town) return
    if (!townMap[p.town]) townMap[p.town] = { players: [], totalGames: 0 }
    townMap[p.town].players.push(p)
    townMap[p.town].totalGames += (p.games_played || 0)
  })

  const townData = Object.keys(townMap).map(town => {
    const tp = townMap[town].players
    const avgElo = Math.round(tp.reduce((s, p) => s + p.elo, 0) / tp.length)
    const activity = Math.min((townMap[town].totalGames / tp.length) * 10, 100)
    const score = Math.round(avgElo * 0.7 + activity * 3 * 0.3)
    return { town, playerCount: tp.length, avgElo, score }
  }).sort((a, b) => b.score - a.score)

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: "'DM Sans', sans-serif", color: '#888' }}>Loading towns...</div>

  if (townData.length === 0) return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Towns</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>See where MahjRank players are located</p>
      </div>
      <div style={{ background: 'white', border: '0.5px dashed #c8cdd6', borderRadius: 12, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: '#888', fontFamily: "'DM Sans', sans-serif" }}>No towns represented yet. Players can add their town in their profile.</div>
      </div>
    </div>
  )

  const maxScore = townData[0]?.score || 1

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Towns</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>Where MahjRank players are located · Score = 70% avg Elo + 30% activity</p>
      </div>

      {/* Top 3 podium */}
      {townData.length >= 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[1, 0, 2].map(idx => {
            const t = townData[idx]
            if (!t) return <div key={idx} />
            const medals = ['🥇', '🥈', '🥉']
            const isGold = idx === 0
            return (
              <div key={t.town} style={{
                background: isGold ? '#FFFBEB' : 'white',
                border: isGold ? '1.5px solid #F59E0B' : '0.5px solid #c8cdd6',
                borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                order: idx === 0 ? 2 : idx === 1 ? 1 : 3
              }}>
                <div style={{ fontSize: 22 }}>{medals[idx]}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>{t.town}</div>
                <div style={{ fontSize: 9, color: '#888', fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>{t.playerCount} player{t.playerCount !== 1 ? 's' : ''} · avg {t.avgElo}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#DC2626', fontFamily: "'JetBrains Mono', monospace", margin: '4px 0' }}>{t.score}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Card layout */}
      <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, overflow: 'hidden' }}>
        {townData.map((t, i) => (
          <div key={t.town} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px',
            background: i < 3 ? '#FFFBEB' : 'white',
            borderBottom: i < townData.length - 1 ? '0.5px solid #e8e8e4' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i < 3 ? '#0F172A' : '#e8e8e4',
                color: i < 3 ? '#F59E0B' : '#888',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{t.town}</div>
                <div style={{ fontSize: 11, color: '#888', fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
                  {t.playerCount} player{t.playerCount !== 1 ? 's' : ''} · avg Elo {t.avgElo}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 60, height: 6, background: '#e8e8e4', borderRadius: 3 }}>
                <div style={{ width: `${Math.round((t.score / maxScore) * 100)}%`, height: 6, background: '#065F46', borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626', fontFamily: "'JetBrains Mono', monospace", minWidth: 40, textAlign: 'right' }}>{t.score}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}