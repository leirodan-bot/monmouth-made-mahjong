import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const ALL_TOWNS = [
  'Aberdeen', 'Allenhurst', 'Allentown', 'Atlantic Highlands', 'Avon-by-the-Sea',
  'Belford', 'Belmar', 'Bradley Beach', 'Brielle', 'Colts Neck',
  'Deal', 'Eatontown', 'Englishtown', 'Fair Haven', 'Farmingdale',
  'Freehold', 'Freehold Township', 'Highlands', 'Holmdel', 'Howell',
  'Interlaken', 'Keansburg', 'Keyport', 'Lake Como', 'Little Silver',
  'Loch Arbour', 'Long Branch', 'Manalapan', 'Manasquan', 'Marlboro',
  'Matawan', 'Middletown', 'Millstone', 'Monmouth Beach', 'Monmouth Junction',
  'Neptune', 'Neptune City', 'Ocean Grove', 'Oceanport', 'Red Bank',
  'Roosevelt', 'Rumson', 'Sea Bright', 'Sea Girt', 'Shrewsbury',
  'Spring Lake', 'Spring Lake Heights', 'Tinton Falls', 'Upper Freehold',
  'Wall Township', 'West Long Branch'
]

function townScore(avgElo, playerCount, gamesPlayed) {
  if (playerCount === 0) return 0
  const activity = Math.min((gamesPlayed / playerCount) * 10, 100)
  return Math.round(avgElo * 0.7 + activity * 3 * 0.3)
}

export default function Towns() {
  const [players, setPlayers] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlayers()
  }, [])

  async function fetchPlayers() {
    const { data } = await supabase.from('players').select('town, elo, games_played')
    setPlayers(data || [])
    setLoading(false)
  }

  const townData = ALL_TOWNS.map(town => {
    const tp = players.filter(p => p.town === town)
    const avgElo = tp.length > 0 ? Math.round(tp.reduce((s, p) => s + p.elo, 0) / tp.length) : 0
    const totalGames = tp.reduce((s, p) => s + (p.games_played || 0), 0)
    const score = townScore(avgElo, tp.length, totalGames)
    return { town, playerCount: tp.length, avgElo, score }
  }).sort((a, b) => b.score - a.score)

  const activeTowns = townData.filter(t => t.playerCount > 0)
  const emptyTowns = townData.filter(t => t.playerCount === 0)
  const displayed = filter === 'active' ? activeTowns : filter === 'empty' ? emptyTowns : townData
  const maxScore = townData[0]?.score || 1

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'sans-serif', color: '#888' }}>Loading towns...</div>

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2744' }}>Top Towns</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>Representing Monmouth County · Score = 70% avg Elo + 30% activity</p>
      </div>

      {/* Top 3 podium */}
      {activeTowns.length >= 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[1, 0, 2].map(idx => {
            const t = activeTowns[idx]
            if (!t) return <div key={idx} />
            const medals = ['🥇', '🥈', '🥉']
            const isGold = idx === 0
            return (
              <div key={t.town} style={{
                background: isGold ? '#fffdf0' : 'white',
                border: isGold ? '1.5px solid #b8860b' : '0.5px solid #c8cdd6',
                borderRadius: 10, padding: 14, textAlign: 'center',
                order: idx === 0 ? 2 : idx === 1 ? 1 : 3
              }}>
                <div style={{ fontSize: 22 }}>{medals[idx]}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2744', marginTop: 4 }}>{t.town}</div>
                <div style={{ fontSize: 10, color: '#888', fontFamily: 'sans-serif', marginTop: 2 }}>{t.playerCount} player{t.playerCount !== 1 ? 's' : ''} · avg {t.avgElo}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#9f1239', margin: '6px 0' }}>{t.score.toLocaleString()}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['all', 'active', 'empty'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600,
            border: '0.5px solid #c8cdd6',
            background: filter === f ? '#1a2744' : 'white',
            color: filter === f ? '#f4f4f2' : '#555',
            cursor: 'pointer'
          }}>
            {f === 'all' ? 'All towns' : f === 'active' ? `Active (${activeTowns.length})` : `Unrepresented (${emptyTowns.length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#1a2744' }}>
              {['#', 'Town', 'Players', 'Avg Elo', 'Town Score', ''].map(h => (
                <th key={h} style={{ padding: '9px 12px', color: '#ffffff', fontSize: 11, fontWeight: 700, textAlign: 'left', fontFamily: 'Playfair Display, serif' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((t, i) => {
              const rank = activeTowns.findIndex(a => a.town === t.town) + 1
              const barWidth = t.score > 0 ? Math.round((t.score / maxScore) * 100) : 0
              return (
                <tr key={t.town} style={{ borderBottom: '0.5px solid #e8e8e4' }}>
                  <td style={{ padding: '9px 12px', color: '#888', fontWeight: 700 }}>{t.playerCount > 0 ? rank : '—'}</td>
                  <td style={{ padding: '9px 12px', fontWeight: 700, color: t.playerCount > 0 ? '#1a2744' : '#aaa' }}>{t.town}</td>
                  <td style={{ padding: '9px 12px', fontFamily: 'sans-serif' }}>
                    {t.playerCount > 0
                      ? <span style={{ background: '#d1fae5', color: '#065f46', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontFamily: 'sans-serif', fontWeight: 600 }}>{t.playerCount} player{t.playerCount !== 1 ? 's' : ''}</span>
                      : <span style={{ background: '#f4f4f2', color: '#aaa', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontFamily: 'sans-serif' }}>none yet</span>
                    }
                  </td>
                  <td style={{ padding: '9px 12px', color: '#555', fontFamily: 'sans-serif' }}>{t.avgElo > 0 ? t.avgElo.toLocaleString() : '—'}</td>
                  <td style={{ padding: '9px 12px', fontWeight: 700, color: '#9f1239', fontFamily: 'Playfair Display, serif' }}>{t.score > 0 ? t.score.toLocaleString() : '—'}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ width: 80, height: 6, background: '#f4f4f2', borderRadius: 3 }}>
                      <div style={{ width: `${barWidth}%`, height: 6, background: '#1a2744', borderRadius: 3 }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}