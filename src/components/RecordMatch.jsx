import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function calcElo(playerElo, opponentElo, won) {
  const K = 32
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
  return Math.round(K * ((won ? 1 : 0) - expected))
}

export default function RecordMatch({ session, player }) {
  const [players, setPlayers] = useState([])
  const [winner, setWinner] = useState('')
  const [opponents, setOpponents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [pendingMatches, setPendingMatches] = useState([])
  const [tab, setTab] = useState('submit')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: playerData } = await supabase.from('players').select('*').order('name')
    setPlayers(playerData || [])

    if (player?.id) {
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'pending')
        .contains('loser_ids', [player.id])
      setPendingMatches(matchData || [])
    }
    setLoading(false)
  }

  function toggleOpponent(id) {
    if (opponents.includes(id)) {
      setOpponents(opponents.filter(o => o !== id))
    } else if (opponents.length < 3) {
      setOpponents([...opponents, id])
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!winner || opponents.length === 0) return
    setSaving(true)
    setError('')

    const winnerPlayer = players.find(p => p.id === winner)
    const loserPlayers = players.filter(p => opponents.includes(p.id))
    const avgLoserElo = Math.round(loserPlayers.reduce((s, p) => s + p.elo, 0) / loserPlayers.length)
    const winnerEloChange = calcElo(winnerPlayer.elo, avgLoserElo, true)
    const winnerEloAfter = winnerPlayer.elo + winnerEloChange

    const { error: matchError } = await supabase.from('matches').insert({
      winner_id: winner,
      loser_ids: opponents,
      winner_elo_before: winnerPlayer.elo,
      winner_elo_after: winnerEloAfter,
      loser_elo_before: loserPlayers.map(p => p.elo),
      loser_elo_after: loserPlayers.map(p => p.elo + calcElo(p.elo, winnerPlayer.elo, false)),
      status: 'pending',
      submitted_by: player.id,
      confirmations: [],
      required_confirmations: Math.ceil(opponents.length / 2) + (opponents.length > 1 ? 0 : 0)
    })

    if (matchError) {
      setError('Something went wrong. Please try again.')
      setSaving(false)
      return
    }

    for (const opp of loserPlayers) {
      await supabase.from('notifications').insert({
        player_id: opp.id,
        type: 'confirm_match',
        message: `${winnerPlayer.name} recorded a match where they won. Please confirm or dispute this result.`
      })
    }

    setSuccess(true)
    setWinner('')
    setOpponents([])
    setSaving(false)
    setTimeout(() => setSuccess(false), 4000)
    fetchData()
  }

  async function confirmMatch(matchId) {
    const match = pendingMatches.find(m => m.id === matchId)
    if (!match) return

    const currentConfirmations = match.confirmations || []
    if (currentConfirmations.includes(player.id)) return

    const newConfirmations = [...currentConfirmations, player.id]
    const required = Math.ceil(match.loser_ids.length / 2) + (match.loser_ids.length > 1 ? 0 : 0)
    const majority = match.loser_ids.length === 1 ? 1 : Math.ceil(match.loser_ids.length / 2) + (match.loser_ids.length % 2 === 0 ? 0 : 0)

    if (newConfirmations.length >= majority) {
      // Majority reached — update Elo
      const winnerPlayer = players.find(p => p.id === match.winner_id)
      const loserPlayers = players.filter(p => match.loser_ids.includes(p.id))

      await supabase.from('players').update({
        elo: match.winner_elo_after,
        wins: (winnerPlayer?.wins || 0) + 1,
        games_played: (winnerPlayer?.games_played || 0) + 1,
        current_streak: (winnerPlayer?.current_streak || 0) + 1,
      }).eq('id', match.winner_id)

      for (let i = 0; i < loserPlayers.length; i++) {
        const lp = loserPlayers[i]
        await supabase.from('players').update({
          elo: Math.max(100, match.loser_elo_after[i]),
          losses: (lp.losses || 0) + 1,
          games_played: (lp.games_played || 0) + 1,
          current_streak: 0,
        }).eq('id', lp.id)
      }

      await supabase.from('matches').update({
        status: 'confirmed',
        confirmations: newConfirmations,
        confirmed_at: new Date().toISOString()
      }).eq('id', matchId)

    } else {
      // Not yet majority — just record confirmation
      await supabase.from('matches').update({
        confirmations: newConfirmations
      }).eq('id', matchId)
    }

    fetchData()
  }

  async function disputeMatch(matchId) {
    await supabase.from('matches').update({ status: 'disputed' }).eq('id', matchId)
    fetchData()
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'sans-serif', color: '#888' }}>Loading...</div>

  const availableOpponents = players.filter(p => p.id !== winner)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2744' }}>Record a Match</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>
          Majority of opponents must confirm before Elo updates. Auto-accepted after 48 hours.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['submit', 'confirm'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13,
            fontFamily: 'Playfair Display, serif', fontWeight: 700,
            background: tab === t ? '#1a2744' : 'white',
            color: tab === t ? '#f4f4f2' : '#1a2744',
            border: tab === t ? 'none' : '0.5px solid #c8cdd6',
            cursor: 'pointer'
          }}>
            {t === 'submit' ? 'Submit Result' : `Confirm Results${pendingMatches.length > 0 ? ` (${pendingMatches.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'submit' && (
        <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 24, maxWidth: 520 }}>
          {success && (
            <div style={{ background: '#d1fae5', border: '0.5px solid #6ee7b7', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#065f46', fontFamily: 'sans-serif', marginBottom: 16 }}>
              ✅ Match submitted! Opponents have been notified to confirm.
            </div>
          )}
          {error && (
            <div style={{ background: '#fee2e2', border: '0.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991b1b', fontFamily: 'sans-serif', marginBottom: 16 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Winner</label>
              <select value={winner} onChange={e => { setWinner(e.target.value); setOpponents(opponents.filter(o => o !== e.target.value)) }}>
                <option value="">Select winner...</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.town} ({p.elo} Elo)</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 6 }}>
                Other players at the table (up to 3)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {availableOpponents.map(p => (
                  <button key={p.id} type="button" onClick={() => toggleOpponent(p.id)} style={{
                    padding: '8px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'sans-serif',
                    textAlign: 'left', cursor: 'pointer',
                    background: opponents.includes(p.id) ? '#eef1f8' : 'white',
                    border: opponents.includes(p.id) ? '1.5px solid #1a2744' : '0.5px solid #c8cdd6',
                    color: '#1a2744', fontWeight: opponents.includes(p.id) ? 700 : 400
                  }}>
                    {p.name}
                    <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>{p.elo}</span>
                  </button>
                ))}
              </div>
            </div>

            {winner && opponents.length > 0 && (
              <div style={{ background: '#f4f4f2', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, fontFamily: 'sans-serif', color: '#555' }}>
                {(() => {
                  const wp = players.find(p => p.id === winner)
                  const lps = players.filter(p => opponents.includes(p.id))
                  const avgLoserElo = Math.round(lps.reduce((s, p) => s + p.elo, 0) / lps.length)
                  const change = calcElo(wp.elo, avgLoserElo, true)
                  const required = opponents.length === 1 ? 1 : Math.ceil(opponents.length / 2) + (opponents.length === 3 ? 0 : 0)
                  return `${wp.name} gains +${change} Elo → ${wp.elo + change} · Requires ${required === 1 ? '1' : required} of ${opponents.length} confirmations`
                })()}
              </div>
            )}

            <button type="submit" disabled={!winner || opponents.length === 0 || saving} style={{
              width: '100%',
              background: winner && opponents.length > 0 ? '#1a2744' : '#e5e7eb',
              color: winner && opponents.length > 0 ? '#f4f4f2' : '#aaa',
              border: 'none', borderRadius: 8, padding: 11,
              fontSize: 13, fontFamily: 'Playfair Display, serif', fontWeight: 700
            }}>
              {saving ? 'Submitting...' : 'Submit Match Result'}
            </button>
          </form>
        </div>
      )}

      {tab === 'confirm' && (
        <div>
          {pendingMatches.length === 0 ? (
            <div style={{ background: 'white', border: '0.5px dashed #c8cdd6', borderRadius: 12, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#888', fontFamily: 'sans-serif' }}>No pending confirmations — you're all caught up!</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {pendingMatches.map(match => {
                const winnerPlayer = players.find(p => p.id === match.winner_id)
                const confirmations = match.confirmations || []
                const required = match.loser_ids.length === 1 ? 1 : Math.ceil(match.loser_ids.length / 2) + (match.loser_ids.length === 3 ? 0 : 0)
                const alreadyConfirmed = confirmations.includes(player?.id)

                return (
                  <div key={match.id} style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginBottom: 4 }}>
                      {winnerPlayer?.name} won this game
                    </div>
                    <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginBottom: 8 }}>
                      {new Date(match.played_at).toLocaleDateString()} · {confirmations.length} of {required} confirmations received
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                      {match.loser_ids.map((_, i) => (
                        <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < confirmations.length ? '#1a2744' : '#e5e7eb' }} />
                      ))}
                      <span style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginLeft: 4 }}>
                        Need {required} to confirm
                      </span>
                    </div>
                    {alreadyConfirmed ? (
                      <div style={{ fontSize: 12, color: '#065f46', fontFamily: 'sans-serif', background: '#d1fae5', padding: '6px 12px', borderRadius: 6 }}>
                        ✓ You confirmed this match
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => confirmMatch(match.id)} style={{ background: '#1a2744', color: '#f4f4f2', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontFamily: 'sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                          ✓ Confirm
                        </button>
                        <button onClick={() => disputeMatch(match.id)} style={{ background: 'white', color: '#9f1239', border: '0.5px solid #9f1239', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontFamily: 'sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                          Dispute
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}