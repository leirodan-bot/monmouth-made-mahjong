import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { calculateGameEloUpdates } from '../eloUtils'

// NMJL Card sections with lines and point values
const NMJL_SECTIONS = [
  { key: 'CR', name: 'Consecutive Run', lines: [
    { line: 1, pts: 25 }, { line: 2, pts: 25 }, { line: 3, pts: 25 }, { line: 4, pts: 25 }, { line: 5, pts: 30 }, { line: 6, pts: 30 }
  ]},
  { key: '13579', name: '13579', lines: [
    { line: 1, pts: 25 }, { line: 2, pts: 25 }, { line: 3, pts: 25 }, { line: 4, pts: 25 }, { line: 5, pts: 30 }
  ]},
  { key: '2468', name: '2468', lines: [
    { line: 1, pts: 25 }, { line: 2, pts: 25 }, { line: 3, pts: 25 }, { line: 4, pts: 25 }, { line: 5, pts: 30 }
  ]},
  { key: 'ALN', name: 'Any Like Numbers', lines: [
    { line: 1, pts: 25 }, { line: 2, pts: 25 }, { line: 3, pts: 25 }, { line: 4, pts: 30 }, { line: 5, pts: 30 }
  ]},
  { key: 'QU', name: 'Quints', lines: [
    { line: 1, pts: 40 }, { line: 2, pts: 40 }, { line: 3, pts: 45 }, { line: 4, pts: 45 }
  ]},
  { key: 'WD', name: 'Winds & Dragons', lines: [
    { line: 1, pts: 25 }, { line: 2, pts: 25 }, { line: 3, pts: 25 }, { line: 4, pts: 30 }, { line: 5, pts: 30 }
  ]},
  { key: '369', name: '369', lines: [
    { line: 1, pts: 25 }, { line: 2, pts: 25 }, { line: 3, pts: 25 }, { line: 4, pts: 30 }
  ]},
  { key: 'SP', name: 'Singles & Pairs', lines: [
    { line: 1, pts: 50 }, { line: 2, pts: 50 }, { line: 3, pts: 50 }
  ]},
]

export default function RecordMatch({ session, player, refreshPlayer }) {
  const [players, setPlayers] = useState([])
  const [locations, setLocations] = useState([])
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

  // Step wizard
  const [step, setStep] = useState(1) // 1=Players, 2=Location, 3=Winner, 4=Details, 5=Confirm

  // Location
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locTab, setLocTab] = useState('recent')
  const [newLocName, setNewLocName] = useState('')
  const [newLocType, setNewLocType] = useState('home')
  const [showNewLoc, setShowNewLoc] = useState(false)

  // Win details (Step 4)
  const [winMethod, setWinMethod] = useState('') // 'self_pick' or 'discard'
  const [throwerId, setThrowerId] = useState('')
  const [exposures, setExposures] = useState(null) // 0, 1, 2, 3
  const [jokerless, setJokerless] = useState(false)
  const [handSection, setHandSection] = useState('')
  const [handLine, setHandLine] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: playerData } = await supabase.from('players').select('*').order('name')
    setPlayers(playerData || [])

    const { data: locData } = await supabase.from('locations').select('*').order('created_at', { ascending: false })
    setLocations(locData || [])

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

  function getSelectedSection() {
    return NMJL_SECTIONS.find(s => s.key === handSection)
  }

  function getHandPoints() {
    const sec = getSelectedSection()
    if (!sec || !handLine) return 0
    const line = sec.lines.find(l => l.line === handLine)
    return line ? line.pts : 0
  }

  function calculateScoring() {
    const basePts = getHandPoints()
    const isSP = handSection === 'SP'
    let winnerBonus = 0
    let throwerPenalty = 0

    if (winMethod === 'self_pick') winnerBonus += 10
    if (jokerless && !isSP) winnerBonus += 20
    if (winMethod === 'discard' && exposures >= 3 && throwerId) throwerPenalty = -25

    return { basePts, winnerBonus, throwerPenalty, total: basePts + winnerBonus }
  }

  function resetForm() {
    setStep(1)
    setSelectedPlayers([])
    setSelectedLocation(null)
    setWinner('')
    setIsWallGame(false)
    setWinMethod('')
    setThrowerId('')
    setExposures(null)
    setJokerless(false)
    setHandSection('')
    setHandLine(null)
  }

  async function createLocation() {
    if (!newLocName.trim()) return
    const { data } = await supabase.from('locations').insert({
      name: newLocName.trim(),
      type: newLocType,
      created_by: player.id
    }).select().single()
    if (data) {
      setLocations([data, ...locations])
      setSelectedLocation(data)
      setShowNewLoc(false)
      setNewLocName('')
    }
  }

  function getEloPreview() {
    if (selectedPlayers.length < 3 || (!winner && !isWallGame)) return null
    const tablePlayers = players
      .filter(p => selectedPlayers.includes(p.id))
      .map(p => ({ id: p.id, elo: p.elo, games_played: p.games_played, elo_rated_games: p.elo_rated_games || 0, elo_seasonal_games: p.elo_seasonal_games || 0 }))
    return calculateGameEloUpdates(tablePlayers, isWallGame ? null : winner)
  }

  async function handleSubmit() {
    if (selectedPlayers.length < 3 || selectedPlayers.length > 4) return
    if (!isWallGame && !winner) return
    setSaving(true)
    setError('')

    const tablePlayers = players
      .filter(p => selectedPlayers.includes(p.id))
      .map(p => ({ id: p.id, elo: p.elo, games_played: p.games_played, elo_rated_games: p.elo_rated_games || 0, elo_seasonal_games: p.elo_seasonal_games || 0 }))

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
      played_at: new Date().toISOString(),
      winner_is_logger: winner === player.id,
      location_id: selectedLocation?.id || null,
      win_method: isWallGame ? null : winMethod || null,
      thrower_id: isWallGame ? null : throwerId || null,
      exposures: isWallGame ? null : exposures,
      jokerless: isWallGame ? false : jokerless,
      hand_section: isWallGame ? null : handSection || null,
      hand_line: isWallGame ? null : handLine,
      hand_points: isWallGame ? null : getHandPoints() || null,
    }

    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert(matchRecord)
      .select()
      .single()

    if (matchError) {
      setError('Something went wrong. Please try again.')
      setSaving(false)
      return
    }

    const otherPlayers = selectedPlayers.filter(id => id !== player.id)
    const submitterName = player?.name || 'Someone'
    const winnerName = players.find(p => p.id === winner)?.name
    for (const pid of otherPlayers) {
      await supabase.from('notifications').insert({
        player_id: pid,
        match_id: matchData.id,
        type: 'confirm_match',
        read: false,
        message: isWallGame
          ? `${submitterName} recorded a wall game. Please confirm.`
          : `${submitterName} recorded a game where ${winnerName} won. Please confirm or dispute.`
      })
    }

    setSuccess(true)
    setSaving(false)
    setTimeout(() => { setSuccess(false); resetForm(); fetchData() }, 3000)
  }

  async function confirmMatch(matchId) {
    try {
      const { data, error } = await supabase.rpc('confirm_game', {
        p_match_id: matchId,
        p_player_id: player.id
      })
      if (error) console.error('Confirm error:', error)
      else if (refreshPlayer) refreshPlayer()
    } catch (err) {
      console.error('Confirm failed:', err)
    }
    fetchData()
  }

  async function disputeMatch(matchId) {
    try {
      await supabase.rpc('dispute_game', {
        p_match_id: matchId,
        p_player_id: player.id
      })
    } catch (err) {
      console.error('Dispute failed:', err)
    }
    fetchData()
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'sans-serif', color: '#888' }}>Loading...</div>

  const filteredPlayers = players.filter(p =>
    !selectedPlayers.includes(p.id) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const preview = getEloPreview()
  const scoring = (!isWallGame && winner && handSection && handLine) ? calculateScoring() : null
  const losers = selectedPlayers.filter(id => id !== winner)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e2b65' }}>Record a Game</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>1 player must confirm. Auto-verified after 48 hours.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['submit', 'confirm'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontFamily: 'Playfair Display, serif', fontWeight: 700, cursor: 'pointer',
            background: tab === t ? '#1e2b65' : 'white', color: tab === t ? '#f4f4f2' : '#1e2b65',
            border: tab === t ? 'none' : '0.5px solid #c8cdd6'
          }}>
            {t === 'submit' ? 'Submit Result' : `Confirm Results${pendingMatches.length > 0 ? ` (${pendingMatches.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'submit' && (
        <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 12, padding: 24 }}>

          {success && (
            <div style={{ background: '#d1fae5', border: '0.5px solid #6ee7b7', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#065f46', fontFamily: 'sans-serif', marginBottom: 16 }}>
              Game submitted! Waiting for confirmation.
            </div>
          )}

          {error && (
            <div style={{ background: '#fee2e2', border: '0.5px solid #fca5a5', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#991b1b', fontFamily: 'sans-serif', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Step indicators */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {[1,2,3,4,5].map(s => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: s <= step ? '#1e2b65' : '#e8e8e4'
              }} />
            ))}
          </div>

          {/* === STEP 1: PLAYERS === */}
          {step === 1 && (
            <div>
              <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 6, letterSpacing: '1px' }}>
                STEP 1 — PLAYERS AT THE TABLE ({selectedPlayers.length}/4)
              </label>

              {selectedPlayers.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {selectedPlayers.map(id => {
                    const p = players.find(pl => pl.id === id)
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, background: '#eef1f8', border: '1px solid #1e2b65', fontSize: 12, fontFamily: 'sans-serif', fontWeight: 600, color: '#1e2b65' }}>
                        {p?.name}
                        <span onClick={() => togglePlayer(id)} style={{ cursor: 'pointer', color: '#9f1239', fontWeight: 700 }}>✕</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {selectedPlayers.length < 4 && (
                <div>
                  <input type="text" placeholder="Search players..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid #c8cdd6', fontSize: 13, fontFamily: 'sans-serif', marginBottom: 6, boxSizing: 'border-box' }} />
                  <div style={{ maxHeight: 160, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {filteredPlayers.slice(0, 20).map(p => (
                      <button key={p.id} type="button" onClick={() => { togglePlayer(p.id); setSearchQuery('') }}
                        style={{ padding: '6px 8px', borderRadius: 6, fontSize: 12, fontFamily: 'sans-serif', textAlign: 'left', cursor: 'pointer', background: 'white', border: '0.5px solid #c8cdd6', color: '#1e2b65' }}>
                        {p.name} <span style={{ fontSize: 10, color: '#888' }}>{Math.round(p.elo || 800)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button disabled={selectedPlayers.length < 3} onClick={() => setStep(2)}
                style={{ marginTop: 16, width: '100%', padding: 11, borderRadius: 8, border: 'none', fontSize: 13, fontFamily: 'Playfair Display, serif', fontWeight: 700, cursor: 'pointer',
                  background: selectedPlayers.length >= 3 ? '#1e2b65' : '#e5e7eb', color: selectedPlayers.length >= 3 ? '#f4f4f2' : '#aaa' }}>
                Next: Location →
              </button>
            </div>
          )}

          {/* === STEP 2: LOCATION === */}
          {step === 2 && (
            <div>
              <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 6, letterSpacing: '1px' }}>
                STEP 2 — WHERE DID YOU PLAY?
              </label>

              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {['recent', 'clubs', 'home'].map(t => (
                  <button key={t} onClick={() => setLocTab(t)} style={{
                    padding: '5px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600, cursor: 'pointer',
                    background: locTab === t ? '#1e2b65' : 'white', color: locTab === t ? '#f4f4f2' : '#555',
                    border: locTab === t ? 'none' : '0.5px solid #c8cdd6'
                  }}>
                    {t === 'recent' ? 'Recent' : t === 'clubs' ? 'Clubs' : 'Home Games'}
                  </button>
                ))}
              </div>

              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'grid', gap: 6, marginBottom: 12 }}>
                {locations
                  .filter(l => locTab === 'recent' ? true : locTab === 'clubs' ? l.type === 'club' : l.type === 'home')
                  .slice(0, locTab === 'recent' ? 5 : 20)
                  .map(l => (
                    <button key={l.id} onClick={() => setSelectedLocation(l)} style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: 12, fontFamily: 'sans-serif', textAlign: 'left', cursor: 'pointer',
                      background: selectedLocation?.id === l.id ? '#eef1f8' : 'white',
                      border: selectedLocation?.id === l.id ? '1.5px solid #1e2b65' : '0.5px solid #c8cdd6', color: '#1e2b65'
                    }}>
                      <div style={{ fontWeight: 600 }}>{l.name}</div>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{l.type === 'club' ? 'Club' : l.type === 'home' ? 'Home Game' : 'Other'}</div>
                    </button>
                  ))}
                {locations.filter(l => locTab === 'recent' ? true : locTab === 'clubs' ? l.type === 'club' : l.type === 'home').length === 0 && (
                  <div style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', padding: 12 }}>No locations yet. Create one below.</div>
                )}
              </div>

              {!showNewLoc ? (
                <button onClick={() => setShowNewLoc(true)} style={{ fontSize: 12, color: '#1e2b65', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: 600, marginBottom: 12 }}>
                  + New Location
                </button>
              ) : (
                <div style={{ background: '#f4f4f2', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="Location name (e.g. Barbara's Tuesday Game)"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid #c8cdd6', fontSize: 12, fontFamily: 'sans-serif', marginBottom: 8, boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {['home', 'club', 'other'].map(t => (
                      <button key={t} onClick={() => setNewLocType(t)} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'sans-serif', cursor: 'pointer',
                        background: newLocType === t ? '#1e2b65' : 'white', color: newLocType === t ? '#f4f4f2' : '#555',
                        border: newLocType === t ? 'none' : '0.5px solid #c8cdd6'
                      }}>
                        {t === 'home' ? 'Home Game' : t === 'club' ? 'Club' : 'Other'}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={createLocation} style={{ background: '#1e2b65', color: '#f4f4f2', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontFamily: 'sans-serif', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setShowNewLoc(false)} style={{ background: 'white', color: '#888', border: '0.5px solid #c8cdd6', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontFamily: 'sans-serif', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(1)} style={{ padding: 11, borderRadius: 8, border: '0.5px solid #c8cdd6', fontSize: 13, fontFamily: 'sans-serif', cursor: 'pointer', background: 'white', color: '#555' }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: 11, borderRadius: 8, border: 'none', fontSize: 13, fontFamily: 'Playfair Display, serif', fontWeight: 700, cursor: 'pointer', background: '#1e2b65', color: '#f4f4f2' }}>
                  Next: Winner →
                </button>
              </div>
              {!selectedLocation && <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginTop: 6 }}>Location is optional — you can skip it.</div>}
            </div>
          )}

          {/* === STEP 3: WINNER / WALL === */}
          {step === 3 && (
            <div>
              <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 6, letterSpacing: '1px' }}>
                STEP 3 — WHO WON?
              </label>

              <div style={{ marginBottom: 10 }}>
                <button type="button" onClick={() => { setIsWallGame(!isWallGame); if (!isWallGame) setWinner('') }} style={{
                  padding: '8px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'sans-serif', fontWeight: 600,
                  background: isWallGame ? '#1e2b65' : 'white', color: isWallGame ? '#f4f4f2' : '#1e2b65',
                  border: isWallGame ? 'none' : '0.5px solid #c8cdd6', cursor: 'pointer'
                }}>
                  {isWallGame ? '🧱 Wall Game (No Winner)' : 'Wall Game?'}
                </button>
              </div>

              {!isWallGame && (
                <div style={{ display: 'grid', gridTemplateColumns: selectedPlayers.length <= 3 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 6, marginBottom: 16 }}>
                  {selectedPlayers.map(id => {
                    const p = players.find(pl => pl.id === id)
                    const isSelected = winner === id
                    return (
                      <button key={id} type="button" onClick={() => setWinner(id)} style={{
                        padding: '12px 8px', borderRadius: 8, fontSize: 13, fontFamily: 'sans-serif',
                        textAlign: 'center', cursor: 'pointer', fontWeight: isSelected ? 700 : 400,
                        background: isSelected ? '#fffdf0' : 'white',
                        border: isSelected ? '2px solid #b8860b' : '0.5px solid #c8cdd6', color: '#1e2b65'
                      }}>
                        {isSelected && '🏆 '}{p?.name}
                      </button>
                    )
                  })}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} style={{ padding: 11, borderRadius: 8, border: '0.5px solid #c8cdd6', fontSize: 13, fontFamily: 'sans-serif', cursor: 'pointer', background: 'white', color: '#555' }}>← Back</button>
                <button disabled={!isWallGame && !winner} onClick={() => setStep(isWallGame ? 5 : 4)}
                  style={{ flex: 1, padding: 11, borderRadius: 8, border: 'none', fontSize: 13, fontFamily: 'Playfair Display, serif', fontWeight: 700, cursor: 'pointer',
                    background: (isWallGame || winner) ? '#1e2b65' : '#e5e7eb', color: (isWallGame || winner) ? '#f4f4f2' : '#aaa' }}>
                  {isWallGame ? 'Next: Confirm →' : 'Next: Win Details →'}
                </button>
              </div>
            </div>
          )}

          {/* === STEP 4: WIN DETAILS (NMJL) === */}
          {step === 4 && !isWallGame && (
            <div>
              <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 10, letterSpacing: '1px' }}>
                STEP 4 — WIN DETAILS (optional but helps tracking)
              </label>

              {/* Win method */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e2b65', marginBottom: 6 }}>How did they win?</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ k: 'self_pick', label: '🎯 Self-picked (drew from wall)' }, { k: 'discard', label: '📤 Off a discard' }].map(m => (
                    <button key={m.k} onClick={() => { setWinMethod(m.k); if (m.k === 'self_pick') setThrowerId('') }} style={{
                      flex: 1, padding: '10px 8px', borderRadius: 8, fontSize: 12, fontFamily: 'sans-serif', cursor: 'pointer',
                      background: winMethod === m.k ? '#eef1f8' : 'white',
                      border: winMethod === m.k ? '1.5px solid #1e2b65' : '0.5px solid #c8cdd6', color: '#1e2b65'
                    }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Who threw it */}
              {winMethod === 'discard' && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e2b65', marginBottom: 6 }}>Who threw the winning tile?</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {losers.map(id => {
                      const p = players.find(pl => pl.id === id)
                      return (
                        <button key={id} onClick={() => setThrowerId(id)} style={{
                          flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontFamily: 'sans-serif', cursor: 'pointer',
                          background: throwerId === id ? '#fee2e2' : 'white',
                          border: throwerId === id ? '1.5px solid #9f1239' : '0.5px solid #c8cdd6', color: '#1e2b65'
                        }}>
                          {p?.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Exposures */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e2b65', marginBottom: 6 }}>Winner's exposures (visible sets on rack)</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0, 1, 2, 3].map(n => (
                    <button key={n} onClick={() => setExposures(n)} style={{
                      width: 48, padding: '8px', borderRadius: 8, fontSize: 13, fontFamily: 'sans-serif', fontWeight: 600, cursor: 'pointer', textAlign: 'center',
                      background: exposures === n ? '#eef1f8' : 'white',
                      border: exposures === n ? '1.5px solid #1e2b65' : '0.5px solid #c8cdd6', color: '#1e2b65'
                    }}>
                      {n === 3 ? '3+' : n}
                    </button>
                  ))}
                </div>
                {exposures >= 3 && throwerId && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#9f1239', fontFamily: 'sans-serif' }}>
                    ⚠ {players.find(p => p.id === throwerId)?.name} gets a -25 penalty for throwing into 3+ exposures
                  </div>
                )}
              </div>

              {/* Jokerless */}
              <div style={{ marginBottom: 16 }}>
                <button onClick={() => setJokerless(!jokerless)} style={{
                  padding: '8px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'sans-serif', fontWeight: 600, cursor: 'pointer',
                  background: jokerless ? '#fffdf0' : 'white', border: jokerless ? '1.5px solid #b8860b' : '0.5px solid #c8cdd6', color: '#1e2b65'
                }}>
                  {jokerless ? '🃏 Jokerless Hand (+20 bonus)' : '🃏 Jokerless?'}
                </button>
                {jokerless && handSection === 'SP' && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#888', fontFamily: 'sans-serif' }}>Note: Singles & Pairs hands don't receive the jokerless bonus per NMJL rules.</div>
                )}
              </div>

              {/* NMJL Hand */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e2b65', marginBottom: 6 }}>NMJL hand (from the card)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {NMJL_SECTIONS.map(s => (
                    <button key={s.key} onClick={() => { setHandSection(s.key); setHandLine(null) }} style={{
                      padding: '6px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600, cursor: 'pointer',
                      background: handSection === s.key ? '#1e2b65' : 'white', color: handSection === s.key ? '#f4f4f2' : '#555',
                      border: handSection === s.key ? 'none' : '0.5px solid #c8cdd6'
                    }}>
                      {s.key}
                    </button>
                  ))}
                </div>
                {handSection && (
                  <div>
                    <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginBottom: 4 }}>{getSelectedSection()?.name} — select line:</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {getSelectedSection()?.lines.map(l => (
                        <button key={l.line} onClick={() => setHandLine(l.line)} style={{
                          padding: '8px 12px', borderRadius: 6, fontSize: 12, fontFamily: 'sans-serif', cursor: 'pointer', textAlign: 'center',
                          background: handLine === l.line ? '#eef1f8' : 'white',
                          border: handLine === l.line ? '1.5px solid #1e2b65' : '0.5px solid #c8cdd6', color: '#1e2b65'
                        }}>
                          <div style={{ fontWeight: 600 }}>Line {l.line}</div>
                          <div style={{ fontSize: 10, color: '#888' }}>{l.pts} pts</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Scoring summary */}
              {scoring && (
                <div style={{ background: '#f4f4f2', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, fontFamily: 'sans-serif' }}>
                  <div style={{ fontWeight: 700, color: '#1e2b65', marginBottom: 6 }}>Scoring Breakdown</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Base ({handSection} Line {handLine})</span><span>{scoring.basePts} pts</span></div>
                  {winMethod === 'self_pick' && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}><span>Self-picked bonus</span><span>+10</span></div>}
                  {jokerless && handSection !== 'SP' && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b8860b' }}><span>Jokerless bonus</span><span>+20</span></div>}
                  {scoring.throwerPenalty < 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9f1239' }}><span>{players.find(p => p.id === throwerId)?.name} penalty (3+ exp)</span><span>{scoring.throwerPenalty}</span></div>}
                  <hr style={{ border: 'none', borderTop: '0.5px solid #c8cdd6', margin: '6px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#1e2b65' }}><span>Winner collects (per player)</span><span>{scoring.total} pts</span></div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(3)} style={{ padding: 11, borderRadius: 8, border: '0.5px solid #c8cdd6', fontSize: 13, fontFamily: 'sans-serif', cursor: 'pointer', background: 'white', color: '#555' }}>← Back</button>
                <button onClick={() => setStep(5)} style={{ flex: 1, padding: 11, borderRadius: 8, border: 'none', fontSize: 13, fontFamily: 'Playfair Display, serif', fontWeight: 700, cursor: 'pointer', background: '#1e2b65', color: '#f4f4f2' }}>
                  Next: Confirm & Submit →
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginTop: 6 }}>All fields here are optional. You can skip ahead if you don't have the hand details.</div>
            </div>
          )}

          {/* === STEP 5: CONFIRM & SUBMIT === */}
          {step === 5 && (
            <div>
              <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 10, letterSpacing: '1px' }}>
                STEP 5 — REVIEW & SUBMIT
              </label>

              <div style={{ background: '#f4f4f2', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'grid', gap: 8, fontSize: 12, fontFamily: 'sans-serif' }}>
                  <div><span style={{ color: '#888' }}>Players:</span> <span style={{ color: '#1e2b65', fontWeight: 600 }}>{selectedPlayers.map(id => players.find(p => p.id === id)?.name).join(', ')}</span></div>
                  {selectedLocation && <div><span style={{ color: '#888' }}>Location:</span> <span style={{ color: '#1e2b65', fontWeight: 600 }}>{selectedLocation.name}</span></div>}
                  <div><span style={{ color: '#888' }}>Result:</span> <span style={{ color: '#1e2b65', fontWeight: 600 }}>{isWallGame ? '🧱 Wall Game' : `🏆 ${players.find(p => p.id === winner)?.name} won`}</span></div>
                  {!isWallGame && winMethod && <div><span style={{ color: '#888' }}>Method:</span> <span style={{ color: '#1e2b65', fontWeight: 600 }}>{winMethod === 'self_pick' ? '🎯 Self-picked' : '📤 Off a discard'}{throwerId ? ` (${players.find(p => p.id === throwerId)?.name} threw)` : ''}</span></div>}
                  {!isWallGame && exposures !== null && <div><span style={{ color: '#888' }}>Exposures:</span> <span style={{ color: '#1e2b65', fontWeight: 600 }}>{exposures >= 3 ? '3+' : exposures}</span></div>}
                  {!isWallGame && jokerless && <div><span style={{ color: '#888' }}>Jokerless:</span> <span style={{ color: '#b8860b', fontWeight: 600 }}>Yes (+20){handSection === 'SP' ? ' (no bonus for S&P)' : ''}</span></div>}
                  {!isWallGame && handSection && handLine && <div><span style={{ color: '#888' }}>Hand:</span> <span style={{ color: '#1e2b65', fontWeight: 600 }}>{getSelectedSection()?.name} Line {handLine} — {getHandPoints()} pts</span></div>}
                </div>
              </div>

              {/* Elo preview */}
              {preview && (
                <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: '#888', fontFamily: 'sans-serif', letterSpacing: '1px', marginBottom: 8 }}>
                    {isWallGame ? 'WALL GAME — NO RATING CHANGES' : 'ELO CHANGES'}
                  </div>
                  {preview.map(u => {
                    const p = players.find(pl => pl.id === u.id)
                    const isW = u.id === winner
                    return (
                      <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 12, fontFamily: 'sans-serif' }}>
                        <span style={{ color: '#1e2b65', fontWeight: isW ? 700 : 400 }}>{isW && '🏆 '}{p?.name}</span>
                        <span style={{ fontWeight: 600, color: u.delta > 0 ? '#16a34a' : u.delta < 0 ? '#dc2626' : '#888' }}>
                          {u.delta > 0 ? '+' : ''}{u.delta.toFixed(1)} → {Math.round(u.newRating)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {winner === player.id && (
                <div style={{ background: '#fff7ed', border: '0.5px solid #fed7aa', borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: 'sans-serif', color: '#92400e', marginBottom: 16 }}>
                  ⚠ You are submitting yourself as the winner. This game will show as "unverified" until another player confirms it.
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(isWallGame ? 3 : 4)} style={{ padding: 11, borderRadius: 8, border: '0.5px solid #c8cdd6', fontSize: 13, fontFamily: 'sans-serif', cursor: 'pointer', background: 'white', color: '#555' }}>← Back</button>
                <button disabled={saving} onClick={handleSubmit} style={{ flex: 1, padding: 11, borderRadius: 8, border: 'none', fontSize: 13, fontFamily: 'Playfair Display, serif', fontWeight: 700, cursor: 'pointer', background: '#1e2b65', color: '#f4f4f2' }}>
                  {saving ? 'Submitting...' : 'Submit Game Result'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === CONFIRM RESULTS TAB === */}
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e2b65', marginBottom: 4 }}>
                      {match.is_wall_game ? '🧱 Wall Game' : `🏆 ${winnerPlayer?.name || 'Unknown'} won`}
                    </div>
                    <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginBottom: 4 }}>
                      {new Date(match.played_at).toLocaleDateString()} · {confirmations.length}/1 confirmations
                    </div>
                    {match.hand_section && <div style={{ fontSize: 11, color: '#555', fontFamily: 'sans-serif', marginBottom: 8 }}>{match.hand_section} Line {match.hand_line} · {match.hand_points} pts{match.jokerless ? ' · Jokerless' : ''}{match.win_method === 'self_pick' ? ' · Self-picked' : ''}</div>}
                    {match.elo_updates && (
                      <div style={{ background: '#f4f4f2', borderRadius: 6, padding: '8px 10px', marginBottom: 10, fontSize: 11, fontFamily: 'sans-serif' }}>
                        {match.elo_updates.map(u => {
                          const p = players.find(pl => pl.id === u.id)
                          return (
                            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>{p?.name}</span>
                              <span style={{ fontWeight: 600, color: u.delta > 0 ? '#16a34a' : u.delta < 0 ? '#dc2626' : '#888' }}>{u.delta > 0 ? '+' : ''}{u.delta.toFixed(1)}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {alreadyConfirmed ? (
                      <div style={{ fontSize: 12, color: '#065f46', fontFamily: 'sans-serif', background: '#d1fae5', padding: '6px 12px', borderRadius: 6 }}>✓ You confirmed this game</div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => confirmMatch(match.id)} style={{ background: '#1e2b65', color: '#f4f4f2', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontFamily: 'sans-serif', fontWeight: 700, cursor: 'pointer' }}>✓ Confirm</button>
                        <button onClick={() => disputeMatch(match.id)} style={{ background: 'white', color: '#9f1239', border: '0.5px solid #9f1239', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontFamily: 'sans-serif', fontWeight: 700, cursor: 'pointer' }}>Dispute</button>
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
