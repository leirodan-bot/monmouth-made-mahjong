import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { calculateGameEloUpdates, getTier } from '../eloUtils'

export default function RecordMatch({ session, player }) {
  const [players, setPlayers] = useState([])
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [winner, setWinner] = useState('')
  const [isWallGame, setIsWallGame] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [pendingMatches, setPendingMatches] = useState([])
  const [tab, setTab] = useState('submit')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: playerData } = await supabase.from('players').select('*').order('name')
    setPlayers(playerData || [])

    if (player?.id) {
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'pending')
        .contains('player_ids', [player.id])
        .neq('submitted_by', player.id)
      setPendingMatches(matchData || [])
    }
    setLoading(false)
  }

  function togglePlayer(id) {
    if (selectedPlayers.includes(id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p !== id))
      if (winner === id) setWinner('')
    } else if (selectedPlayers.length < 4) {
      setSelectedPlayers([...selectedPlayers, id])
    }
  }

  function getEloPreview() {
    if (selectedPlayers.length < 3 || (!winner && !isWallGame)) return null
    const tablePlayers = players
      .filter(p => selectedPlayers.includes(p.id))
      .map(p => ({ id: p.id, elo: p.elo, games_played: p.games_played }))
    return calculateGameEloUpdates(tablePlayers, isWallGame ? null : winner)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (selectedPlayers.length < 3 || selectedPlayers.length > 4) return
    if (!isWallGame && !winner) return
    setSaving(true)
    setError('')

    const tablePlayers = players
      .filter(p => selectedPlayers.includes(p.id))
      .map(p => ({ id: p.id, elo: p.elo, games_played: p.games_played }))

    const eloUpdates = calculateGameEloUpdates(tablePlayers, isWallGame ? null : winner)

    const matchRecord = {
      winner_id: isWallGame ? null : winner,
      loser_ids: isWallGame ? [] : selectedPlayers.filter(id => id !== winner),
      player_ids: selectedPlayers,
      is_wall_game: isWallGame,
      elo_updates: eloUpdates,
      status: 'pending',
      submitted_by: player.id,
      confirmations: [],
      played_at: new Date().toISOString()
    }

    const { error: matchError } = await supabase.from('matches').insert(matchRecord)

    if (matchError) {
      setError('Something went wrong. Please try again.')
      setSaving(false)
      return
    }

    // Notify other players
    const otherPlayers = selectedPlayers.filter(id => id !== player.id)
    const submitterName = player?.name || 'Someone'
    for (const pid of otherPlayers) {
      await supabase.from('notifications').insert({
        player_id: pid,
        type: 'confirm_match',
        message: isWallGame
          ? `${submitterName} recorded a wall game. Please confirm.`
          : `${submitterName} recorded a game where ${players.find(p => p.id === winner)?.name} won. Please confirm or dispute.`
      })
    }

    setSuccess(true)
    setSelectedPlayers([])
    setWinner('')
    setIsWallGame(false)
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

    // 1 confirmation needed per spec
    if (newConfirmations.length >= 1) {
      const eloUpdates = match.elo_updates || []

      for (const update of eloUpdates) {
        const p = players.find(pl => pl.id === update.id)
        if (!p) continue

        const isWinner = update.id === match.winner_id
        const isWall = match.is_wall_game
        const newTier = getTier(update.newRating).name
        const newPeak = Math.max(p.elo_peak || p.elo, update.newRating)
        const newGamesPlayed = (p.games_played || 0) + 1

        const playerUpdate = {
          elo: update.newRating,
          elo_all_time: Math.max(p.elo_all_time || update.newRating, update.newRating),
          elo_peak: newPeak,
          elo_rank_tier: newTier,
          elo_provisional: newGamesPlayed < 5,
          games_played: newGamesPlayed,
          last_game_date: new Date().toISOString().split('T')[0],
        }

        if (isWall) {
          playerUpdate.wall_games = (p.wall_games || 0) + 1
        } else if (isWinner) {
          playerUpdate.wins = (p.wins || 0) + 1
          playerUpdate.current_streak = (p.current_streak || 0) + 1
        } else {
          playerUpdate.losses = (p.losses || 0) + 1
          playerUpdate.current_streak = 0
        }

        await supabase.from('players').update(playerUpdate).eq('id', update.id)

        await supabase.from('elo_history').insert({
          player_id: update.id,
          game_id: matchId,
          rating_before: update.ratingBefore,
          rating_after: update.newRating,
          rating_change: update.delta,
          k_factor: update.kFactor,
        })
      }

      await supabase.from('matches').update({
        status: 'confirmed',
        confirmations: newConfirmations,
        confirmed_at: new Date().toISOString()
      }).eq('id', matchId)
    } else {
      await supabase.from('matches').update({ confirmations: newConfirmations }).eq('id', matchId)
    }

    fetchData()
  }

  async function disputeMatch(matchId) {
    await supabase.from('matches').update({ status: 'disputed' }).eq('id', matchId)
    fetchData()
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'sans-serif', color: '#888' }}>Loading...</div>

  const filteredPlayers = players.filter(p =>
    !selectedPlayers.includes(p.id) &&
    (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.org?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const preview = getEloPreview()

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2744' }}>Record a Game</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>
          1 player must confirm. Auto-verified after 48 hours.
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
        <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 24, maxWidth: 560 }}>
          {success && (
            <div style={{ background: '#d1fae5', border: '0.5px solid #6ee7b7', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#065f46', fontFamily: 'sans-serif', marginBottom: 16 }}>
              ✅ Game submitted! Players have been notified to confirm.
            </div>
          )}
          {error && (
            <div style={{ background: '#fee2e2', border: '0.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991b1b', fontFamily: 'sans-serif', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Players at the table */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 6, letterSpacing: '1px' }}>
                PLAYERS AT THE TABLE ({selectedPlayers.length}/4)
              </label>

              {selectedPlayers.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {selectedPlayers.map(id => {
                    const p = players.find(pl => pl.id === id)
                    return (
                      <div key={id} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 10px', borderRadius: 20,
                        background: '#eef1f8', border: '1px solid #1a2744',
                        fontSize: 12, fontFamily: 'sans-serif', fontWeight: 600, color: '#1a2744'
                      }}>
                        {p?.name}
                        <span style={{ fontSize: 10, color: '#888' }}>{Math.round(p?.elo || 800)}</span>
                        <span onClick={() => togglePlayer(id)} style={{ cursor: 'pointer', color: '#9f1239', fontWeight: 700, marginLeft: 2 }}>✕</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {selectedPlayers.length < 4 && (
                <div>
                  <input
                    type="text" placeholder="Search players..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid #c8cdd6', fontSize: 13, fontFamily: 'sans-serif', marginBottom: 6, boxSizing: 'border-box' }}
                  />
                  <div style={{ maxHeight: 160, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {filteredPlayers.slice(0, 20).map(p => (
                      <button key={p.id} type="button" onClick={() => { togglePlayer(p.id); setSearchQuery('') }} style={{
                        padding: '6px 8px', borderRadius: 6, fontSize: 12, fontFamily: 'sans-serif',
                        textAlign: 'left', cursor: 'pointer', background: 'white', border: '0.5px solid #c8cdd6', color: '#1a2744'
                      }}>
                        {p.name} <span style={{ fontSize: 10, color: '#888' }}>{Math.round(p.elo)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Game outcome */}
            {selectedPlayers.length >= 3 && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 6, letterSpacing: '1px' }}>
                  GAME OUTCOME
                </label>

                <div style={{ marginBottom: 10 }}>
                  <button type="button" onClick={() => { setIsWallGame(!isWallGame); if (!isWallGame) setWinner('') }} style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'sans-serif', fontWeight: 600,
                    background: isWallGame ? '#1a2744' : 'white',
                    color: isWallGame ? '#f4f4f2' : '#1a2744',
                    border: isWallGame ? 'none' : '0.5px solid #c8cdd6', cursor: 'pointer'
                  }}>
                    {isWallGame ? '🧱 Wall Game (No Winner)' : 'Wall Game?'}
                  </button>
                </div>

                {!isWallGame && (
                  <div style={{ display: 'grid', gridTemplateColumns: selectedPlayers.length <= 3 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 6 }}>
                    {selectedPlayers.map(id => {
                      const p = players.find(pl => pl.id === id)
                      const isSelected = winner === id
                      return (
                        <button key={id} type="button" onClick={() => setWinner(id)} style={{
                          padding: '10px 8px', borderRadius: 8, fontSize: 13, fontFamily: 'sans-serif',
                          textAlign: 'center', cursor: 'pointer', fontWeight: isSelected ? 700 : 400,
                          background: isSelected ? '#fffdf0' : 'white',
                          border: isSelected ? '2px solid #b8860b' : '0.5px solid #c8cdd6', color: '#1a2744'
                        }}>
                          {isSelected && '🏆 '}{p?.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Elo preview */}
            {preview && (
              <div style={{ background: '#f4f4f2', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: '#888', fontFamily: 'sans-serif', letterSpacing: '1px', marginBottom: 8 }}>
                  {isWallGame ? 'WALL GAME — NO RATING CHANGES' : 'ELO PREVIEW'}
                </div>
                {preview.map(u => {
                  const p = players.find(pl => pl.id === u.id)
                  const isW = u.id === winner
                  return (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 12, fontFamily: 'sans-serif' }}>
                      <span style={{ color: '#1a2744', fontWeight: isW ? 700 : 400 }}>
                        {isW && '🏆 '}{p?.name}
                      </span>
                      <span style={{ fontWeight: 600, color: u.delta > 0 ? '#16a34a' : u.delta < 0 ? '#dc2626' : '#888' }}>
                        {u.delta > 0 ? '+' : ''}{u.delta.toFixed(1)} → {Math.round(u.newRating)}
                        <span style={{ fontSize: 10, color: '#aaa', marginLeft: 4 }}>K={u.kFactor}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            <button type="submit" disabled={selectedPlayers.length < 3 || (!isWallGame && !winner) || saving} style={{
              width: '100%',
              background: (selectedPlayers.length >= 3 && (isWallGame || winner)) ? '#1a2744' : '#e5e7eb',
              color: (selectedPlayers.length >= 3 && (isWallGame || winner)) ? '#f4f4f2' : '#aaa',
              border: 'none', borderRadius: 8, padding: 11,
              fontSize: 13, fontFamily: 'Playfair Display, serif', fontWeight: 700, cursor: 'pointer'
            }}>
              {saving ? 'Submitting...' : isWallGame ? 'Submit Wall Game' : 'Submit Game Result'}
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
                const alreadyConfirmed = confirmations.includes(player?.id)
                return (
                  <div key={match.id} style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginBottom: 4 }}>
                      {match.is_wall_game ? '🧱 Wall Game' : `🏆 ${winnerPlayer?.name || 'Unknown'} won`}
                    </div>
                    <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginBottom: 8 }}>
                      {new Date(match.played_at).toLocaleDateString()} · {confirmations.length}/1 confirmations
                    </div>
                    {match.elo_updates && (
                      <div style={{ background: '#f4f4f2', borderRadius: 6, padding: '8px 10px', marginBottom: 10, fontSize: 11, fontFamily: 'sans-serif' }}>
                        {match.elo_updates.map(u => {
                          const p = players.find(pl => pl.id === u.id)
                          return (
                            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>{p?.name}</span>
                              <span style={{ fontWeight: 600, color: u.delta > 0 ? '#16a34a' : u.delta < 0 ? '#dc2626' : '#888' }}>
                                {u.delta > 0 ? '+' : ''}{u.delta.toFixed(1)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {alreadyConfirmed ? (
                      <div style={{ fontSize: 12, color: '#065f46', fontFamily: 'sans-serif', background: '#d1fae5', padding: '6px 12px', borderRadius: 6 }}>
                        ✓ You confirmed this game
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
